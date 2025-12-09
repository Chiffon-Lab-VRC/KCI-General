/**
 * Discord Webhook Utility
 * Sends notifications to Discord via webhook
 */

/**
 * Send a message to Discord webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} payload - Discord message payload
 * @returns {Promise<Response>}
 */
export async function sendDiscordMessage(webhookUrl, payload) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Discord API error: ${response.status} - ${error}`);
        }

        return response;
    } catch (error) {
        console.error('Failed to send Discord message:', error);
        throw error;
    }
}

/**
 * Get Discord user info from mapping
 * @param {string} userName - Redmine user name
 * @param {Object} userMapping - Mapping of user names to Discord info
 * @returns {Object} Object with id, name, and mention properties
 */
function getDiscordUserInfo(userName, userMapping) {
    if (!userName || !userMapping) {
        return {
            id: null,
            name: userName || '不明',
            mention: null
        };
    }

    const mapping = userMapping[userName];
    if (!mapping) {
        return {
            id: null,
            name: userName,
            mention: null
        };
    }

    // If mapping is an object with id and name
    if (typeof mapping === 'object' && mapping.id) {
        return {
            id: mapping.id,
            name: mapping.name || userName,
            mention: `<@${mapping.id}>`
        };
    }

    // If mapping is just an ID string
    if (typeof mapping === 'string') {
        return {
            id: mapping,
            name: userName, // Use Redmine name as display fallback
            mention: `<@${mapping}>`
        };
    }

    return {
        id: null,
        name: userName,
        mention: null
    };
}

/**
 * Get display name for embed (for readability)
 * @param {string} userName - Redmine user name
 * @param {Object} userMapping - Mapping of user names to Discord info
 * @returns {string} Display name with @ prefix
 */
export function getDiscordDisplayName(userName, userMapping) {
    const userInfo = getDiscordUserInfo(userName, userMapping);
    return `@${userInfo.name}`;
}

/**
 * Get mention string for notifications (to ping users)
 * @param {string} userName - Redmine user name
 * @param {Object} userMapping - Mapping of user names to Discord info
 * @returns {string|null} Mention string like <@123456789> or null
 */
export function getDiscordMention(userName, userMapping) {
    const userInfo = getDiscordUserInfo(userName, userMapping);
    return userInfo.mention;
}

/**
 * Format due date notification message as plain text with mentions
 * @param {Object} notifications - Object containing tomorrow, today, and overdue tickets
 * @param {Object} userMapping - Mapping of user names to Discord info
 * @returns {Object} Discord message payload
 */
export function formatDueDateNotification(notifications, userMapping) {
    const { tomorrow, today, overdue } = notifications;

    const messages = [];

    // Tomorrow's due dates
    if (tomorrow && tomorrow.length > 0) {
        messages.push('📅 **明日が期日のチケット:**');
        tomorrow.forEach(ticket => {
            const userName = ticket.assigned_to?.name;
            const mention = getDiscordMention(userName, userMapping);
            const displayName = getDiscordDisplayName(userName, userMapping);

            if (mention) {
                messages.push(`${mention} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date})`);
            } else {
                messages.push(`${displayName} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date})`);
            }
        });
        messages.push('');
    }

    // Today's due dates
    if (today && today.length > 0) {
        messages.push('⏰ **今日が期日のチケット:**');
        today.forEach(ticket => {
            const userName = ticket.assigned_to?.name;
            const mention = getDiscordMention(userName, userMapping);
            const displayName = getDiscordDisplayName(userName, userMapping);

            if (mention) {
                messages.push(`${mention} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date})`);
            } else {
                messages.push(`${displayName} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date})`);
            }
        });
        messages.push('');
    }

    // Overdue tickets
    if (overdue && overdue.length > 0) {
        messages.push('🚨 **期日を過ぎているチケット:**');
        overdue.forEach(ticket => {
            const userName = ticket.assigned_to?.name;
            const mention = getDiscordMention(userName, userMapping);
            const displayName = getDiscordDisplayName(userName, userMapping);
            const daysOverdue = Math.floor((new Date() - new Date(ticket.due_date)) / (1000 * 60 * 60 * 24));

            if (mention) {
                messages.push(`${mention} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date}) ⚠️ **${daysOverdue}日超過**`);
            } else {
                messages.push(`${displayName} [#${ticket.id}] ${ticket.subject} (期日: ${ticket.due_date}) ⚠️ **${daysOverdue}日超過**`);
            }
        });
        messages.push('');
    }

    if (messages.length === 0) {
        return {
            content: '✅ 期日に関する通知はありません。',
        };
    }

    return {
        content: '🔔 **期日リマインダー**\n\n' + messages.join('\n')
    };
}
