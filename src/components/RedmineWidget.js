"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

const RedmineWidget = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('time'); // 'time' or 'status'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' or specific status

    useEffect(() => {
        fetch('/api/redmine/issues')
            .then(res => res.json())
            .then(data => {
                if (data.issues) {
                    setIssues(data.issues);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getStatusClass = (statusName) => {
        if (!statusName) return '';
        const lower = statusName.toLowerCase();

        // 今やってます [doing] - オレンジ
        if (lower.includes('今やってます') || lower.includes('doing')) return 'doing';

        // レビューお願い [Req-Rev] - 紫
        if (lower.includes('レビュー') || lower.includes('req-rev') || lower.includes('review')) return 'review';

        // 新規タスク [popup] - 緑
        if (lower.includes('新規') || lower.includes('popup') || lower.includes('new')) return 'popup';

        // 保留中 [pending] - 灰色
        if (lower.includes('保留') || lower.includes('pending')) return 'pending';

        // 直してね [Sendback] - 赤
        if (lower.includes('直して') || lower.includes('sendback')) return 'sendback';

        return '';
    };

    if (loading) return <div className={styles.widget}>Loading Tickets...</div>;

    // フィルタリング処理
    const filteredIssues = filterStatus === 'all'
        ? issues
        : issues.filter(issue => issue.status.name === filterStatus);

    // ソート処理
    const sortedIssues = [...filteredIssues].sort((a, b) => {
        if (sortBy === 'status') {
            return a.status.name.localeCompare(b.status.name, 'ja');
        }
        // デフォルト: 時系列順（番号の降順 = 新しい順）
        return b.id - a.id;
    });

    // ユニークなステータスリストを取得
    const uniqueStatuses = [...new Set(issues.map(issue => issue.status.name))].sort((a, b) => a.localeCompare(b, 'ja'));

    return (
        <div className={styles.widget}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Redmine Tickets ({sortedIssues.length})</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            background: 'var(--secondary)',
                            color: 'var(--foreground)',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">全て表示</option>
                        {uniqueStatuses.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            background: 'var(--secondary)',
                            color: 'var(--foreground)',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="time">時系列順</option>
                        <option value="status">ステータス順</option>
                    </select>
                </div>
            </div>
            <div className={styles.scrollableList}>
                {sortedIssues.map(issue => (
                    <a key={issue.id} href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                        <div className={styles.compactItem}>
                            <div className={styles.compactHeader}>
                                <span className={styles.id}>#{issue.id}</span>
                                <span className={`${styles.status} ${styles[getStatusClass(issue.status.name)] || ''}`}>
                                    {issue.status.name}
                                </span>
                            </div>
                            <div className={styles.compactContent}>
                                <p className={styles.compactSubject} title={issue.subject}>{issue.subject}</p>
                                {issue.assigned_to && (
                                    <span className={styles.compactAuthor}>{issue.assigned_to.name}</span>
                                )}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default RedmineWidget;
