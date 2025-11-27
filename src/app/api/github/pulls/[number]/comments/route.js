import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { number } = await params;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        // Mock data for development
        return NextResponse.json({
            comments: [
                {
                    id: 1,
                    user: { login: "copilot", avatar_url: "https://avatars.githubusercontent.com/ml/1" },
                    body: "This looks good! The implementation follows best practices.",
                    created_at: new Date().toISOString(),
                    html_url: "#"
                },
                {
                    id: 2,
                    user: { login: "developer", avatar_url: "https://github.com/identicons/developer.png" },
                    body: "LGTM! Ready to merge.",
                    created_at: new Date().toISOString(),
                    html_url: "#"
                }
            ]
        });
    }

    try {
        // Fetch review comments
        const reviewCommentsRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${number}/comments`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Fetch issue comments (general comments on the PR)
        const issueCommentsRes = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${number}/comments`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!reviewCommentsRes.ok || !issueCommentsRes.ok) {
            throw new Error('Failed to fetch comments from GitHub');
        }

        const reviewComments = await reviewCommentsRes.json();
        const issueComments = await issueCommentsRes.json();

        // Combine and sort by creation date
        const allComments = [...reviewComments, ...issueComments].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );

        return NextResponse.json({ comments: allComments });
    } catch (error) {
        return NextResponse.json({ error: error.message, comments: [] }, { status: 500 });
    }
}
