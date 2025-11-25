import { NextResponse } from 'next/server';

export async function GET() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        // Return mock data if env vars are not set
        return NextResponse.json([
            {
                sha: "mock123",
                html_url: "#",
                commit: { message: "Mock: feat: add new sidebar", author: { name: "dev-user", date: new Date().toISOString() } }
            },
            {
                sha: "mock456",
                html_url: "#",
                commit: { message: "Mock: fix: css lint errors", author: { name: "dev-user", date: new Date().toISOString() } }
            },
        ]);
    }

    try {
        // Fetch branches
        const branchesRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!branchesRes.ok) {
            throw new Error('Failed to fetch branches from GitHub');
        }

        const branches = await branchesRes.json();

        // Fetch commits from all branches (limit to first 5 branches to avoid too many API calls)
        const branchesToFetch = branches.slice(0, 5);
        const commitPromises = branchesToFetch.map(branch =>
            fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${branch.name}&per_page=10`, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }).then(res => res.json())
        );

        const allCommitsArrays = await Promise.all(commitPromises);
        const allCommits = allCommitsArrays.flat();

        // Remove duplicates based on SHA and sort by date
        const uniqueCommits = Array.from(
            new Map(allCommits.map(commit => [commit.sha, commit])).values()
        ).sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date))
            .slice(0, 20);

        return NextResponse.json(uniqueCommits);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
