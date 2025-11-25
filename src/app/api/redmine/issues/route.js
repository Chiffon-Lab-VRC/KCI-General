import { NextResponse } from 'next/server';

export async function GET() {
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        // Return mock data if env vars are not set
        return NextResponse.json({
            issues: [
                {
                    id: 101,
                    subject: "Mock: Fix login page layout",
                    status: { name: "In Progress" },
                    priority: { name: "High" },
                    assigned_to: { name: "John Doe" },
                    url: "#"
                },
                {
                    id: 102,
                    subject: "Mock: Update API documentation",
                    status: { name: "New" },
                    priority: { name: "Normal" },
                    assigned_to: { name: "Jane Smith" },
                    url: "#"
                },
            ]
        });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/issues.json?limit=100&status_id=open`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch from Redmine');
        }

        const data = await res.json();
        // Add URL to each issue
        const issuesWithUrl = data.issues.map(issue => ({
            ...issue,
            url: `${REDMINE_URL}/issues/${issue.id}`
        }));

        return NextResponse.json({ ...data, issues: issuesWithUrl });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
