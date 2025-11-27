import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { number } = await params;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        // Mock data for development
        return NextResponse.json({
            timeline: [
                {
                    id: 1,
                    event: 'commented',
                    user: { login: "developer", avatar_url: "https://github.com/identicons/developer.png" },
                    body: "Initial implementation",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    event: 'reviewed',
                    user: { login: "copilot", avatar_url: "https://avatars.githubusercontent.com/ml/1" },
                    body: "Pull request overview\n\nThis looks good overall!",
                    created_at: new Date().toISOString(),
                    state: 'approved'
                }
            ]
        });
    }

    try {
        // Fetch timeline events (includes review events, comments, commits, etc.)
        const timelineRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${number}/timeline`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.mockingbird-preview+json'
                }
            }
        );

        if (!timelineRes.ok) {
            throw new Error('Failed to fetch timeline from GitHub');
        }

        const timeline = await timelineRes.json();

        // Filter to relevant events: commented, reviewed, committed, etc.
        const relevantEvents = timeline.filter(event =>
            ['commented', 'reviewed', 'commit-commented', 'line-commented'].includes(event.event) ||
            event.body // Has a body (comment)
        );

        return NextResponse.json({ timeline: relevantEvents });
    } catch (error) {
        return NextResponse.json({ error: error.message, timeline: [] }, { status: 500 });
    }
}
