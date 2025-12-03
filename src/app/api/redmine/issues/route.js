import { NextResponse } from 'next/server';

export async function GET() {
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        // Return mock data if env vars are not set
        return NextResponse.json({
            issues: [
                {
                    id: 101,
                    subject: "Mock: Fix login page layout",
                    status: { name: "In Progress" },
                    priority: { name: "High" },
                    assigned_to: { name: "John Doe" },
                    url: "#"
                },
                {
                    id: 102,
                    subject: "Mock: Update API documentation",
                    status: { name: "New" },
                    priority: { name: "Normal" },
                    assigned_to: { name: "Jane Smith" },
                    url: "#"
                },
            ]
        });
    }

    try {
        const res = await fetch(`${REDMINE_URL}/issues.json?limit=1000&status_id=*`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch from Redmine');
        }

        const data = await res.json();
        // Add URL to each issue
        const issuesWithUrl = data.issues.map(issue => ({
            ...issue,
            url: `${REDMINE_URL}/issues/${issue.id}`
        }));

        return NextResponse.json({ ...data, issues: issuesWithUrl });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;
    const REDMINE_PROJECT_ID = process.env.REDMINE_PROJECT_ID;

    try {
        const body = await request.json();

        // 環境変数が設定されていない場合はモック成功レスポンスを返す
        if (!REDMINE_URL || !REDMINE_API_KEY) {
            console.warn('Redmine環境変数が設定されていません。モック作成成功を返します。');
            return NextResponse.json({
                issue: {
                    id: Math.floor(Math.random() * 1000) + 1000,
                    ...body,
                    status: { name: "新規" },
                    created_on: new Date().toISOString()
                },
                mock: true
            }, { status: 201 });
        }

        // プロジェクトIDが設定されている場合、リクエストボディに追加（上書きしない場合）
        if (REDMINE_PROJECT_ID && !body.project_id) {
            body.project_id = REDMINE_PROJECT_ID;
        }

        const res = await fetch(`${REDMINE_URL}/issues.json`, {
            method: 'POST',
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ issue: body })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Redmineへの作成に失敗しました: ${errorText}`);
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 201 });

    } catch (error) {
        console.error('Ticket creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
