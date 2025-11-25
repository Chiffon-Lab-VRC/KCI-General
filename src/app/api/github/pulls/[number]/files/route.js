import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { number } = await params;
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
        // Mock data
        return NextResponse.json({
            files: [
                { filename: "src/app/page.js", status: "modified", additions: 10, deletions: 5, patch: "@@ -1,5 +1,10 @@\n- old code\n+ new code" },
                { filename: "src/components/Widget.js", status: "added", additions: 20, deletions: 0, patch: "@@ -0,0 +1,20 @@\n+ new component" }
            ]
        });
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch files');
        }

        const files = await res.json();
        return NextResponse.json({ files });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}
