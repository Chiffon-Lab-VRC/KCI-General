import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const REDMINE_URL = process.env.REDMINE_URL;
    const REDMINE_API_KEY = process.env.REDMINE_API_KEY;

    if (!REDMINE_URL || !REDMINE_API_KEY) {
        // Mock data
        return NextResponse.json({
            issues: [
                { id: 201, subject: `Mock: Related to ${query}`, status: { name: "New" } },
                { id: 202, subject: "Mock: Another related issue", status: { name: "In Progress" } }
            ]
        });
    }

    if (!query) {
        return NextResponse.json({ issues: [] });
    }

    try {
        // Redmine API doesn't have a direct "search by subject" filter in the issues endpoint easily accessible without plugins or specific configuration sometimes.
        // However, we can use the global search API or filter issues list.
        // For simplicity and common Redmine usage, we'll fetch open issues and filter them, or use the search endpoint if available.
        // Let's try fetching issues and filtering by subject on the server side for now, as it's safer than assuming search API availability.
        // Note: For large Redmine instances, this is inefficient. A better way is using the search API `/search.json?q=term&issues=1`.

        const res = await fetch(`${REDMINE_URL}/search.json?q=${encodeURIComponent(query)}&issues=1&limit=5`, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY
            }
        });

        if (!res.ok) {
            // Fallback to fetching issues and filtering if search API fails or returns 404 (some configs disable it)
            const issuesRes = await fetch(`${REDMINE_URL}/issues.json?limit=100&status_id=open`, {
                headers: {
                    'X-Redmine-API-Key': REDMINE_API_KEY
                }
            });

            if (!issuesRes.ok) throw new Error('Failed to fetch from Redmine');

            const data = await issuesRes.json();
            const filteredIssues = data.issues.filter(issue =>
                issue.subject.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);

            const issuesWithUrl = filteredIssues.map(issue => ({
                ...issue,
                url: `${REDMINE_URL}/issues/${issue.id}`
            }));

            return NextResponse.json({ issues: issuesWithUrl });
        }

        const data = await res.json();
        // The search API returns 'results', we need to map them to a similar structure or fetch details.
        // Search results usually contain id, title, type, url, description.

        const issues = data.results.map(result => ({
            id: result.id,
            subject: result.title,
            url: result.url, // This might be the API URL, we want the UI URL.
            // We can construct UI URL if we know the base.
            uiUrl: `${REDMINE_URL}/issues/${result.id}`
        }));

        return NextResponse.json({ issues });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
