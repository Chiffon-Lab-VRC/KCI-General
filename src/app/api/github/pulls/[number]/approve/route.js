import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    const { number } = await params;
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
        // Mock success
        return NextResponse.json({ message: 'PR approved (mock)' });
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`, {
            method: 'POST',
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ event: 'APPROVE' }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to approve PR');
        }

        return NextResponse.json({ message: 'PR approved successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
