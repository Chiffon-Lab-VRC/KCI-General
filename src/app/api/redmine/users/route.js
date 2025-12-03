import { NextResponse } from 'next/server';

export async function GET() {
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        return NextResponse.json({
            users: [
                { id: 1, name: "John Doe" },
                { id: 2, name: "Jane Smith" },
                { id: 3, name: "Bob Johnson" }
            ]
        });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/users.json?limit=100&status=1`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch users from Redmine');
        }

        const data = await res.json();

        // Add name property if missing (combine firstname and lastname)
        if (data.users) {
            data.users = data.users.map(user => ({
                ...user,
                name: user.name || `${user.lastname} ${user.firstname}`.trim()
            }));
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
