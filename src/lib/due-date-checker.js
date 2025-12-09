/**
 * Due Date Checker Utility
 * Checks tickets for upcoming and overdue due dates
 */

/**
 * Check if two dates are on the same day
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

/**
 * Parse date string to local Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date}
 */
function parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Categorize tickets by due date
 * @param {Array} tickets - Array of ticket objects from Redmine
 * @returns {Object} Object with tomorrow, today, and overdue arrays
 */
export function categorizeDueDateTickets(tickets) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const notifications = {
        tomorrow: [],
        today: [],
        overdue: []
    };

    // Completed and canceled status IDs (adjust based on your Redmine setup)
    const completedStatusIds = [5, 6]; // 5=完了, 6=中止

    tickets.forEach(ticket => {
        // Skip if no due date
        if (!ticket.due_date) return;

        // Skip if no assigned user
        if (!ticket.assigned_to) return;

        // Skip if completed or canceled
        if (ticket.status && completedStatusIds.includes(ticket.status.id)) return;

        try {
            const dueDate = parseDate(ticket.due_date);

            if (isSameDay(dueDate, tomorrow)) {
                notifications.tomorrow.push(ticket);
            } else if (isSameDay(dueDate, today)) {
                notifications.today.push(ticket);
            } else if (dueDate < today) {
                notifications.overdue.push(ticket);
            }
        } catch (error) {
            console.error(`Failed to parse due date for ticket #${ticket.id}:`, error);
        }
    });

    return notifications;
}

/**
 * Check if there are any notifications to send
 * @param {Object} notifications - Categorized notifications object
 * @returns {boolean}
 */
export function hasNotifications(notifications) {
    return (notifications.tomorrow && notifications.tomorrow.length > 0) ||
        (notifications.today && notifications.today.length > 0) ||
        (notifications.overdue && notifications.overdue.length > 0);
}
