import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { id } = await params;
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        return NextResponse.json({
            issue: {
                id: parseInt(id),
                subject: "Mock Ticket",
                description: "This is a mock ticket description.",
                status: { id: 1, name: "New" },
                priority: { id: 2, name: "Normal" },
                assigned_to: { id: 1, name: "Mock User" },
                author: { name: "Mock Author" },
                created_on: new Date().toISOString(),
                updated_on: new Date().toISOString()
            }
        });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/issues/${id}.json?include=attachments,journals`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch issue from Redmine');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        return NextResponse.json({ success: true, message: 'Mock update successful' });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/issues/${id}.json`, {
            method: 'PUT',
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ issue: body })
        });

        if (!res.ok) {
            const errorData = await res.text();
            throw new Error(`Failed to update issue: ${errorData}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
