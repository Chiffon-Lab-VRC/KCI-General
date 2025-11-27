"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

const RedmineWidget = ({
    externalSelectedTicket = null,
    onExternalTicketClose = null,
    isMobile = false,
    isExpanded = true,
    onToggle = null
}) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [statuses, setStatuses] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [comment, setComment] = useState('');
    const [sortBy, setSortBy] = useState('time'); // 'time' or 'status'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' or specific status



    const fetchIssues = () => {
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
    };

    const fetchStatuses = () => {
        fetch('/api/redmine/statuses')
            .then(res => res.json())
            .then(data => {
                if (data.issue_statuses) {
                    setStatuses(data.issue_statuses);
                }
            })
            .catch(err => console.error(err));
    };

    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setTicketDetails(null);
        setLoadingDetails(true);
        setComment('');

        fetch(`/api/redmine/issues/${ticket.id}`)
            .then(res => res.json())
            .then(data => {
                setTicketDetails(data.issue);
                setLoadingDetails(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingDetails(false);
            });
    };

    const handleStatusUpdate = (statusId) => {
        if (!selectedTicket) return;
        setUpdating(true);
        const updateData = { status_id: statusId };

        fetch(`/api/redmine/issues/${selectedTicket.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTicketDetails(prev => ({
                        ...prev,
                        status: statuses.find(s => s.id === statusId)
                    }));
                    fetchIssues();
                }
                setUpdating(false);
            })
            .catch(err => {
                console.error(err);
                setUpdating(false);
            });
    };

    const handleAddComment = () => {
        if (!comment.trim()) return;

        setUpdating(true);
        const updateData = { notes: comment };

        fetch(`/api/redmine/issues/${selectedTicket.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setComment('');
                    // Refresh details to show new comment
                    handleTicketClick(selectedTicket);
                }
                setUpdating(false);
            })
            .catch(err => {
                console.error(err);
                setUpdating(false);
            });
    };

    useEffect(() => {
        fetchIssues();
        fetchStatuses();

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(() => {
            // Only refresh if no modal is open
            if (!selectedTicket) {
                fetchIssues();
            }
        }, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [selectedTicket]); // Re-create interval when modal state changes

    // Handle external ticket selection (from GitHubPRWidget)
    useEffect(() => {
        if (externalSelectedTicket) {
            handleTicketClick(externalSelectedTicket);
        }
    }, [externalSelectedTicket]);

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
        if (!a || !b) return 0;
        if (sortBy === 'status') {
            return a.status?.name.localeCompare(b.status?.name, 'ja');
        }
        // デフォルト: 時系列順（番号の降順 = 新しい順）
        return (b.id || 0) - (a.id || 0);
    });

    // ユニークなステータスリストを取得
    const uniqueStatuses = [...new Set(issues.filter(i => i && i.status).map(issue => issue.status.name))].sort((a, b) => a.localeCompare(b, 'ja'));

    return (
        <div className={styles.widget}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isExpanded ? '1rem' : '0',
                    paddingBottom: isExpanded ? '0.5rem' : '1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && onToggle && onToggle()}
            >
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                    {isMobile && <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>}
                    Redmine Tickets ({sortedIssues.length})
                </h3>
                {isExpanded && (
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
                )}
            </div>
            {isExpanded && (
                <div className={styles.scrollableList}>
                    {sortedIssues.map(issue => (
                        <div key={issue.id} onClick={() => handleTicketClick(issue)} className={styles.itemLink} style={{ cursor: 'pointer' }}>
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
                        </div>
                    ))}
                </div>
            )}

            {selectedTicket && (
                <div
                    className={styles.modalOverlay}
                    style={externalSelectedTicket ? { zIndex: 1100 } : {}}
                    onClick={() => {
                        setSelectedTicket(null);
                        if (onExternalTicketClose) onExternalTicketClose();
                    }}
                >
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>#{selectedTicket.id}: {selectedTicket.subject}</h2>
                            <div className={styles.modalActions}>
                                <button className={`${styles.button} ${styles.cancelButton}`} onClick={() => {
                                    setSelectedTicket(null);
                                    if (onExternalTicketClose) onExternalTicketClose();
                                }}>
                                    Close
                                </button>
                                <a
                                    href={selectedTicket.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.button} ${styles.approveButton}`}
                                >
                                    Open in Redmine
                                </a>
                            </div>
                        </div>

                        <div className={styles.modalBody}>
                            {loadingDetails ? (
                                <p>Loading details...</p>
                            ) : ticketDetails ? (
                                <>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Status</label>
                                            <select
                                                value={ticketDetails.status?.id || ''}
                                                onChange={(e) => handleStatusUpdate(parseInt(e.target.value))}
                                                disabled={updating}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--foreground)',
                                                    width: '100%',
                                                    maxWidth: '300px'
                                                }}
                                            >
                                                {statuses.map(status => (
                                                    <option key={status.id} value={status.id}>{status.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <strong>Priority:</strong> {ticketDetails.priority?.name}
                                            </div>
                                            <div>
                                                <strong>Assignee:</strong> {ticketDetails.assigned_to?.name || 'Unassigned'}
                                            </div>
                                            <div>
                                                <strong>Author:</strong> {ticketDetails.author?.name}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <strong>Created:</strong> {new Date(ticketDetails.created_on).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                                            </div>
                                            <div>
                                                <strong>Updated:</strong> {new Date(ticketDetails.updated_on).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                                            </div>
                                        </div>
                                    </div>

                                    {ticketDetails.description && (
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                            <h4 style={{ marginBottom: '0.5rem' }}>Description</h4>
                                            <div style={{
                                                whiteSpace: 'pre-wrap',
                                                background: 'var(--secondary)',
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                lineHeight: '1.6'
                                            }}>
                                                {ticketDetails.description}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                        <h4 style={{ marginBottom: '0.5rem' }}>Add Comment</h4>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            disabled={updating}
                                            style={{
                                                width: '100%',
                                                minHeight: '100px',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                background: 'var(--secondary)',
                                                color: 'var(--foreground)',
                                                fontFamily: 'inherit',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.5',
                                                resize: 'vertical'
                                            }}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!comment.trim() || updating}
                                            className={`${styles.button} ${styles.approveButton}`}
                                            style={{ marginTop: '0.5rem' }}
                                        >
                                            {updating ? 'Adding...' : 'Add Comment'}
                                        </button>
                                    </div>

                                    {ticketDetails.journals && ticketDetails.journals.length > 0 && (
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                            <h4 style={{ marginBottom: '0.5rem' }}>Activity ({ticketDetails.journals.length})</h4>
                                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {ticketDetails.journals.slice().reverse().map((journal, idx) => (
                                                    <div key={idx} style={{
                                                        background: 'var(--secondary)',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>
                                                            <strong>{journal.user.name}</strong> - {new Date(journal.created_on).toLocaleString('ja-JP')}
                                                        </div>
                                                        {journal.notes && <div style={{ whiteSpace: 'pre-wrap' }}>{journal.notes}</div>}
                                                        {journal.details && journal.details.length > 0 && (
                                                            <ul style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', paddingLeft: '1rem' }}>
                                                                {journal.details.map((detail, dIdx) => (
                                                                    <li key={dIdx}>
                                                                        {detail.property === 'attr' ? detail.name : detail.property} changed from {detail.old_value} to {detail.new_value}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p>Could not load ticket details.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RedmineWidget;
