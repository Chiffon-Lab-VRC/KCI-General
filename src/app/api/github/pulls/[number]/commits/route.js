import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { number } = await params;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        // Mock data for development
        return NextResponse.json({
            commits: [
                {
                    sha: "abc123def456",
                    commit: {
                        author: {
                            name: "Developer",
                            date: new Date().toISOString()
                        },
                        message: "feat: Add new feature"
                    },
                    author: {
                        login: "developer",
                        avatar_url: "https://github.com/identicons/developer.png"
                    },
                    html_url: "#"
                },
                {
                    sha: "def456abc789",
                    commit: {
                        author: {
                            name: "Developer",
                            date: new Date().toISOString()
                        },
                        message: "fix: Fix bug in API"
                    },
                    author: {
                        login: "developer",
                        avatar_url: "https://github.com/identicons/developer.png"
                    },
                    html_url: "#"
                }
            ]
        });
    }

    try {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${number}/commits`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!res.ok) {
            throw new Error('Failed to fetch commits from GitHub');
        }

        const commits = await res.json();
        return NextResponse.json({ commits });
    } catch (error) {
        return NextResponse.json({ error: error.message, commits: [] }, { status: 500 });
    }
}
