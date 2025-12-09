import { NextResponse } from 'next/server';
import { sendDiscordMessage, formatDueDateNotification, getDiscordMention } from '@/lib/discord';
import { categorizeDueDateTickets, hasNotifications } from '@/lib/due-date-checker';

/**
 * Check due dates and send Discord notifications
 * POST /api/notifications/check-due-dates
 * 
 * Security: Requires API key in Authorization header
 */
export async function POST(request) {
    try {
        // Check API key for security
        const authHeader = request.headers.get('authorization');
        const apiKey = process.env.NOTIFICATION_API_KEY;

        if (apiKey && authHeader !== `Bearer ${apiKey}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get configuration from environment variables
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        const userMappingStr = process.env.DISCORD_USER_MAPPING;
        const redmineUrl = process.env.REDMINE_URL;
        const redmineApiKey = process.env.REDMINE_API_KEY;

        if (!webhookUrl) {
            return NextResponse.json(
                { error: 'DISCORD_WEBHOOK_URL not configured' },
                { status: 500 }
            );
        }

        if (!redmineUrl || !redmineApiKey) {
            return NextResponse.json(
                { error: 'Redmine configuration missing' },
                { status: 500 }
            );
        }

        // Parse user mapping
        let userMapping = {};
        if (userMappingStr) {
            try {
                userMapping = JSON.parse(userMappingStr);
            } catch (error) {
                console.error('Failed to parse DISCORD_USER_MAPPING:', error);
            }
        }

        // Fetch all tickets from Redmine
        const response = await fetch(`${redmineUrl}/issues.json?limit=1000&status_id=*`, {
            headers: {
                'X-Redmine-API-Key': redmineApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Redmine API error: ${response.status}`);
        }

        const data = await response.json();
        const tickets = data.issues || [];

        // Categorize tickets by due date
        const notifications = categorizeDueDateTickets(tickets);

        // Check if there are any notifications to send
        if (!hasNotifications(notifications)) {
            return NextResponse.json({
                success: true,
                message: 'No notifications to send',
                stats: {
                    totalTickets: tickets.length,
                    tomorrow: 0,
                    today: 0,
                    overdue: 0
                }
            });
        }

        // Format and send Discord notification
        const payload = formatDueDateNotification(notifications, userMapping);
        await sendDiscordMessage(webhookUrl, payload);

        return NextResponse.json({
            success: true,
            message: 'Notifications sent successfully',
            stats: {
                totalTickets: tickets.length,
                tomorrow: notifications.tomorrow.length,
                today: notifications.today.length,
                overdue: notifications.overdue.length
            }
        });

    } catch (error) {
        console.error('Failed to check due dates and send notifications:', error);
        return NextResponse.json(
            {
                error: 'Failed to process notifications',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET method for manual testing (disabled in production)
 */
export async function GET() {
    // For security, only allow POST in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'GET method not allowed in production' },
            { status: 405 }
        );
    }

    // In development, allow GET for easy testing
    return POST(new Request('http://localhost:3000/api/notifications/check-due-dates', {
        method: 'POST',
        headers: {
            'authorization': `Bearer ${process.env.NOTIFICATION_API_KEY || 'dev'}`
        }
    }));
}
