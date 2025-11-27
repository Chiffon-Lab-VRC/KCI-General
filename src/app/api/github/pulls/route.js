import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'open'; // 'open', 'closed', or 'all'

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        // Mock data
        return NextResponse.json([
            {
                number: 1,
                title: "Mock: Feature/new-dashboard",
                user: { login: "dev-user" },
                html_url: "#",
                state: "open",
                body: "This is a mock PR description.",
                labels: []
            },
            {
                number: 2,
                title: "Mock: Fix/api-error",
                user: { login: "test-user" },
                html_url: "#",
                state: "closed",
                body: "Fixes the API error on login.",
                labels: []
            }
        ]);
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=${state}&per_page=100`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch from GitHub');
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
