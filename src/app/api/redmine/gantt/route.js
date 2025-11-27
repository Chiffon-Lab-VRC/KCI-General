import { NextResponse } from 'next/server';

const REDMINE_URL = process.env.REDMINE_URL;
const REDMINE_API_KEY = process.env.REDMINE_API_KEY;
const REDMINE_PROJECT_ID = process.env.REDMINE_PROJECT_ID;

/**
 * ガントチャート用のチケットデータを取得
 * クエリパラメータ:
 * - view: 'master' | 'monthly' 
 * - month: 'YYYY-MM' (月次ビューの場合)
 */
export async function GET(request) {
    // 環境変数が設定されていない場合は早期にモックデータを返す
    if (!REDMINE_URL || !REDMINE_API_KEY) {
        console.warn('Redmine環境変数が設定されていません。モックデータを返します。');
        const mockIssues = generateMockIssues();
        return NextResponse.json({
            issues: mockIssues,
            total: mockIssues.length,
            mock: true
        });
    }

    try {
        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view') || 'master';
        const month = searchParams.get('month');

        // Redmine API URL構築
        let url = `${REDMINE_URL}/issues.json?`;

        const params = new URLSearchParams({
            status_id: '*', // すべてのステータス
            limit: '1000', // 表示件数制限を緩和（実質無制限に近い値）
            include: 'children', // 子チケットも含む
        });

        // プロジェクトIDが設定されている場合のみ追加
        if (REDMINE_PROJECT_ID) {
            params.append('project_id', REDMINE_PROJECT_ID);
        }

        // API側での日付フィルタは除外し、全件取得してからJS側でフィルタリングする
        // これにより「期間が月にかかっているチケット」を正確に抽出できる

        url += params.toString();

        console.log('Fetching from Redmine:', url.replace(REDMINE_API_KEY, 'HIDDEN'));

        // Redmine APIにリクエスト
        const response = await fetch(url, {
            headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY,
                'Content-Type': 'application/json'
            },
            cache: 'no-store' // キャッシュを無効化
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Redmine API error:', response.status, errorText);
            throw new Error(`Redmine API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`Redmineから${data.issues?.length || 0}件のチケットを取得しました`);

        let issues = data.issues || [];

        // 日付情報がないチケットは除外
        issues = issues.filter(issue => issue.start_date || issue.due_date);

        // 月次ビューの場合、その月に関わっている（期間が重なる）チケットのみを抽出
        if (view === 'monthly' && month) {
            const [year, monthNum] = month.split('-').map(Number);
            // 月の開始日と終了日（ローカルタイムで計算）
            const monthStart = new Date(year, monthNum - 1, 1);
            const monthEnd = new Date(year, monthNum, 0);
            monthEnd.setHours(23, 59, 59, 999); // 月末の最後の一瞬まで含める

            issues = issues.filter(issue => {
                // 日付文字列をパース
                const parseDate = (dateStr) => {
                    if (!dateStr) return null;
                    const [y, m, d] = dateStr.split('-').map(Number);
                    return new Date(y, m - 1, d);
                };

                const start = parseDate(issue.start_date);
                const end = parseDate(issue.due_date);

                // 開始日も期日もない場合は除外（既にフィルタ済みだが念のため）
                if (!start && !end) return false;

                // 期間の判定
                // 1. 開始日がある場合、開始日が月末以前であること
                // 2. 期日がある場合、期日が月初以降であること
                // 3. 両方ある場合、期間が月と重なっていること

                const effectiveStart = start || end; // 開始日がない場合は期日を開始とみなす
                const effectiveEnd = end || start;   // 期日がない場合は開始日を終了とみなす

                return effectiveStart <= monthEnd && effectiveEnd >= monthStart;
            });
        }

        console.log(`フィルタリング後: ${issues.length}件のチケットを表示します`);

        return NextResponse.json({
            issues: issues,
            total: issues.length,
            total_count: data.total_count,
            mock: false
        });

    } catch (error) {
        console.error('Error fetching gantt data:', error);

        // エラー時はモックデータを返す（開発用）
        const mockIssues = generateMockIssues();
        return NextResponse.json({
            issues: mockIssues,
            total: mockIssues.length,
            mock: true,
            error: error.message
        });
    }
}

// モックデータ生成（開発用）
function generateMockIssues() {
    const now = new Date();
    const issues = [];

    for (let i = 1; i <= 10; i++) {
        const startDate = new Date(now.getFullYear(), now.getMonth(), i);
        const dueDate = new Date(now.getFullYear(), now.getMonth(), i + 7 + Math.floor(Math.random() * 14));

        issues.push({
            id: 1000 + i,
            subject: `サンプルチケット ${i}: ${['フロントエンド開発', 'API設計', 'データベース設計', 'テスト作成'][i % 4]}`,
            start_date: startDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            done_ratio: Math.floor(Math.random() * 100),
            assigned_to: {
                name: ['田中太郎', '佐藤花子', '鈴木一郎', '山田次郎'][i % 4]
            },
            status: {
                name: ['新規', '進行中', 'レビュー待ち', '完了'][Math.floor(Math.random() * 4)]
            }
        });
    }

    return issues;
}
