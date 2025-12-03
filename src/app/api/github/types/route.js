import { NextResponse } from 'next/server';

export async function GET() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = 'okkass';
    const REPO = 'Kamata-Cloud-Infrastructure';
    const PATH = 'srcs/shared/types/api-types.ts';

    if (!GITHUB_TOKEN) {
        return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // GitHub API returns content in base64
        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        return NextResponse.json({ content });
    } catch (error) {
        console.error('GitHub API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
