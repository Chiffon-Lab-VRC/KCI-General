import { NextResponse } from 'next/server';

export async function GET() {
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        return NextResponse.json({
            issue_statuses: [
                { id: 1, name: "New" },
                { id: 2, name: "In Progress" },
                { id: 3, name: "Resolved" },
                { id: 5, name: "Closed" }
            ]
        });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/issue_statuses.json`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch statuses from Redmine');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
