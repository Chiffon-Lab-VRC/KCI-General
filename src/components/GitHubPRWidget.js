"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

import ReactMarkdown from 'react-markdown';

const GitHubPRWidget = ({
    onTicketClick = null,
    isMobile = false,
    isExpanded = true,
    onToggle = null
}) => {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPR, setSelectedPR] = useState(null);
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [relatedTickets, setRelatedTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [filterLabel, setFilterLabel] = useState('all'); // 'all' or specific label
    const [filterState, setFilterState] = useState('open'); // 'open', 'closed', or 'all'
    const [activeTab, setActiveTab] = useState('files'); // 'files', 'conversation', 'commits'
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [commits, setCommits] = useState([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [relatedTicketsExpanded, setRelatedTicketsExpanded] = useState(false); // Collapsed by default on mobile
    const [commitDetails, setCommitDetails] = useState(null);
    const [loadingCommitDetails, setLoadingCommitDetails] = useState(false);

    useEffect(() => {
        fetchPRs();

        // Auto-refresh every 30 seconds
        const intervalId = setInterval(() => {
            // Only refresh if no modal is open
            if (!selectedPR) {
                fetchPRs();
            }
        }, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [selectedPR, filterState]); // Re-create interval when modal or filter state changes

    const fetchPRs = () => {
        fetch(`/api/github/pulls?state=${filterState}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPrs(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handlePRClick = (pr) => {
        setSelectedPR(pr);
        setFiles([]);
        setLoadingFiles(true);
        setRelatedTickets([]);
        setLoadingTickets(true);
        setComments([]);
        setLoadingComments(true);
        setTimeline([]);
        setLoadingTimeline(true);
        setCommits([]);
        setLoadingCommits(true);
        setSelectedCommit(null);
        setCommitDetails(null);
        setActiveTab('files'); // Reset to files tab

        // Fetch Files
        fetch(`/api/github/pulls/${pr.number}/files`)
            .then(res => res.json())
            .then(data => {
                if (data.files) {
                    setFiles(data.files);
                }
                setLoadingFiles(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingFiles(false);
            });

        // Fetch Comments (keeping for backward compatibility)
        fetch(`/api/github/pulls/${pr.number}/comments`)
            .then(res => res.json())
            .then(data => {
                if (data.comments) {
                    setComments(data.comments);
                }
                setLoadingComments(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingComments(false);
            });

        // Fetch Timeline (full conversation) and merge with comments
        Promise.all([
            fetch(`/api/github/pulls/${pr.number}/timeline`).then(res => res.json()),
            fetch(`/api/github/pulls/${pr.number}/comments`).then(res => res.json())
        ])
            .then(([timelineData, commentsData]) => {
                const timelineEvents = timelineData.timeline || [];
                const reviewComments = (commentsData.comments || []).map(comment => ({
                    ...comment,
                    event: 'review_comment',
                    created_at: comment.created_at
                }));

                // Merge and sort all events by date
                const allEvents = [...timelineEvents, ...reviewComments].sort((a, b) => {
                    const dateA = new Date(a.created_at || a.submitted_at || 0);
                    const dateB = new Date(b.created_at || b.submitted_at || 0);
                    return dateA - dateB;
                });

                setTimeline(allEvents);
                setLoadingTimeline(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingTimeline(false);
            });

        // Fetch Commits
        fetch(`/api/github/pulls/${pr.number}/commits`)
            .then(res => res.json())
            .then(data => {
                if (data.commits) {
                    setCommits(data.commits);
                }
                setLoadingCommits(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingCommits(false);
            });

        // Fetch Related Tickets based on labels
        if (pr.labels && pr.labels.length > 0) {
            const fetchPromises = pr.labels.map(label =>
                fetch(`/api/redmine/search?q=${encodeURIComponent(label.name)}`)
                    .then(res => res.json())
                    .then(data => data.issues || [])
            );

            Promise.all(fetchPromises)
                .then(results => {
                    // Flatten and deduplicate results
                    const allIssues = results.flat();
                    const uniqueIssues = Array.from(new Map(allIssues.map(item => [item.id, item])).values());
                    setRelatedTickets(uniqueIssues);
                    setLoadingTickets(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingTickets(false);
                });
        } else {
            setLoadingTickets(false);
        }
    };

    const handleCommitClick = (commit) => {
        setSelectedCommit(commit);
        setLoadingCommitDetails(true);
        setCommitDetails(null);

        fetch(`/api/github/commits/${commit.sha}`)
            .then(res => res.json())
            .then(data => {
                setCommitDetails(data);
                setLoadingCommitDetails(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingCommitDetails(false);
            });
    };

    if (loading) return <div className={styles.widget}>Loading PRs...</div>;

    // フィルタリング処理（ラベル）
    const filteredPRs = filterLabel === 'all'
        ? prs
        : prs.filter(pr => pr.labels && pr.labels.some(label => label.name === filterLabel));

    // 時系列順でソート（新しい順）
    const sortedPRs = [...filteredPRs].sort((a, b) => (b.number || 0) - (a.number || 0));

    // ユニークなラベルリストを取得
    const allLabels = prs.flatMap(pr => pr.labels || []);
    const uniqueLabels = [...new Set(allLabels.map(label => label.name))].sort();

    return (
        <div className={styles.widget}>
            <div
                className="pr-widget-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isExpanded ? '1rem' : '0',
                    paddingBottom: isExpanded ? '0.5rem' : '1rem',
                    borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    cursor: isMobile ? 'pointer' : 'default'
                }}
                onClick={() => isMobile && onToggle && onToggle()}
            >
                <h3 style={{
                    margin: 0,
                    fontSize: (filterState === 'closed' || filterState === 'all') ? '1.1rem' : '1.25rem',
                    fontWeight: 600
                }}>
                    {isMobile && <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>}
                    GitHub Pull Requests ({sortedPRs.length})
                </h3>
                {isExpanded && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <button
                                onClick={() => setFilterState('open')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    border: 'none',
                                    background: filterState === 'open' ? '#FF6B35' : 'var(--secondary)',
                                    color: filterState === 'open' ? '#fff' : 'var(--foreground)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: filterState === 'open' ? '600' : '400'
                                }}
                            >
                                Open
                            </button>
                            <button
                                onClick={() => setFilterState('closed')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    border: 'none',
                                    background: filterState === 'closed' ? '#FF6B35' : 'var(--secondary)',
                                    color: filterState === 'closed' ? '#fff' : 'var(--foreground)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: filterState === 'closed' ? '600' : '400'
                                }}
                            >
                                Closed
                            </button>
                            <button
                                onClick={() => setFilterState('all')}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    border: 'none',
                                    background: filterState === 'all' ? '#FF6B35' : 'var(--secondary)',
                                    color: filterState === 'all' ? '#fff' : 'var(--foreground)',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    fontWeight: filterState === 'all' ? '600' : '400'
                                }}
                            >
                                All
                            </button>
                        </div>
                        <select
                            value={filterLabel}
                            onChange={(e) => setFilterLabel(e.target.value)}
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
                            {uniqueLabels.map(label => (
                                <option key={label} value={label}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            {isExpanded && (
                <div className={styles.scrollableList}>
                    {sortedPRs.map(pr => (
                        <div key={pr.number} onClick={() => handlePRClick(pr)} className={styles.itemLink} style={{ cursor: 'pointer' }}>
                            <div className={styles.compactItem}>
                                <div className={styles.compactHeader}>
                                    <span className={styles.id}>#{pr.number}</span>
                                    <span
                                        className={styles.status}
                                        style={{
                                            background: pr.state === 'open' ? '#2ea44f' : '#8250df'
                                        }}
                                    >
                                        {pr.state === 'open' ? 'Open' :
                                            pr.merged ? 'Merged' :
                                                'Closed'}
                                    </span>
                                    {pr.labels && pr.labels.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {pr.labels.map((label, idx) => (
                                                <span
                                                    key={idx}
                                                    className={styles.label}
                                                    style={{ background: `#${label.color}` }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.compactContent}>
                                    <p className={styles.compactSubject}>{pr.title}</p>
                                    <span className={styles.compactAuthor}>by {pr.user.login}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {prs.length === 0 && <p style={{ padding: '1rem', color: '#888' }}>No open PRs</p>}
                </div>
            )}

            {selectedPR && (
                <div className={styles.modalOverlay} onClick={() => setSelectedPR(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{ flex: 1 }}>
                                {selectedPR.labels && selectedPR.labels.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                        {selectedPR.labels.map((label, idx) => (
                                            <span
                                                key={idx}
                                                className={styles.label}
                                                style={{ background: `#${label.color}` }}
                                            >
                                                {label.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <h2 className={styles.modalTitle}>{selectedPR.title}</h2>
                            </div>
                            <div className={styles.modalActions}>
                                <button className={`${styles.button} ${styles.cancelButton}`} onClick={() => setSelectedPR(null)}>
                                    Close
                                </button>
                                <a
                                    href={selectedPR.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.button} ${styles.approveButton}`}
                                >
                                    Open Pull Request
                                </a>
                            </div>
                        </div>

                        <div className={styles.modalBody}>

                            <div className={styles.modalContentGrid} style={{ height: !isMobile ? 'calc(100vh - 180px)' : 'auto', overflow: !isMobile ? 'hidden' : 'visible' }}>
                                <div className={styles.modalMainColumn} style={{ overflowY: !isMobile ? 'auto' : 'visible', height: !isMobile ? '100%' : 'auto', paddingRight: !isMobile ? '1rem' : '0', paddingBottom: isMobile ? '60px' : '0' }}>
                                    {/* Tab Navigation */}
                                    <div style={{
                                        display: 'flex',
                                        borderBottom: '2px solid var(--border)',
                                        marginBottom: '1.5rem',
                                        gap: '0.5rem'
                                    }}>
                                        <button
                                            onClick={() => setActiveTab('files')}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                border: 'none',
                                                background: activeTab === 'files' ? 'var(--secondary)' : 'transparent',
                                                color: activeTab === 'files' ? 'var(--foreground)' : '#888',
                                                borderBottom: activeTab === 'files' ? '2px solid #FF6B35' : '2px solid transparent',
                                                cursor: 'pointer',
                                                fontWeight: activeTab === 'files' ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Files ({files.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('conversation')}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                border: 'none',
                                                background: activeTab === 'conversation' ? 'var(--secondary)' : 'transparent',
                                                color: activeTab === 'conversation' ? 'var(--foreground)' : '#888',
                                                borderBottom: activeTab === 'conversation' ? '2px solid #FF6B35' : '2px solid transparent',
                                                cursor: 'pointer',
                                                fontWeight: activeTab === 'conversation' ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Conversation ({timeline.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('commits')}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                border: 'none',
                                                background: activeTab === 'commits' ? 'var(--secondary)' : 'transparent',
                                                color: activeTab === 'commits' ? 'var(--foreground)' : '#888',
                                                borderBottom: activeTab === 'commits' ? '2px solid #FF6B35' : '2px solid transparent',
                                                cursor: 'pointer',
                                                fontWeight: activeTab === 'commits' ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Commits ({commits.length})
                                        </button>
                                    </div>

                                    {/* PR Description */}
                                    <div className={styles.markdownContent} style={{ marginBottom: '1.5rem' }}>
                                        <ReactMarkdown>{selectedPR.body || "No description provided."}</ReactMarkdown>
                                    </div>

                                    {activeTab === 'files' && (
                                        <>
                                            <h4 className={styles.filesTitle}>Files Changed</h4>
                                            {loadingFiles ? (
                                                <p>Loading files...</p>
                                            ) : files.length > 0 ? (
                                                files.map((file, index) => (
                                                    <div key={index} className={styles.fileItem}>
                                                        <div className={styles.fileHeader}>
                                                            <span className={styles.fileName}>{file.filename}</span>
                                                            <span className={styles.fileStats}>
                                                                <span style={{ color: '#2ea44f' }}>+{file.additions}</span> / <span style={{ color: '#cb2431' }}>-{file.deletions}</span>
                                                            </span>
                                                        </div>
                                                        {file.patch && (
                                                            <div className={styles.diffContent}>
                                                                {file.patch.split('\n').map((line, idx) => {
                                                                    let bgColor = 'transparent';
                                                                    if (line.startsWith('+') && !line.startsWith('+++')) {
                                                                        bgColor = 'rgba(46, 164, 79, 0.15)';
                                                                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                                                                        bgColor = 'rgba(203, 36, 49, 0.15)';
                                                                    }
                                                                    return (
                                                                        <div key={idx} style={{ backgroundColor: bgColor }}>
                                                                            {line}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: '#888' }}>No files changed.</p>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'conversation' && (
                                        <>
                                            <h4 style={{ marginBottom: '1rem' }}>Full Conversation ({timeline.length})</h4>
                                            {loadingTimeline ? (
                                                <p>Loading conversation...</p>
                                            ) : timeline.length > 0 ? (
                                                <div style={{ position: 'relative' }}>
                                                    {timeline.map((event, index) => {

                                                        // Helper function to get event icon
                                                        const getEventIcon = (eventType) => {
                                                            const iconMap = {
                                                                'commented': '💬',
                                                                'reviewed': '👁️',
                                                                'review_comment': '📝',
                                                                'review_requested': '🔍',
                                                                'labeled': '🏷️',
                                                                'unlabeled': '🏷️',
                                                                'assigned': '👤',
                                                                'unassigned': '👤',
                                                                'milestoned': '🎯',
                                                                'demilestoned': '🎯',
                                                                'renamed': '✏️',
                                                                'locked': '🔒',
                                                                'unlocked': '🔓',
                                                                'head_ref_deleted': '🗑️',
                                                                'head_ref_restored': '♻️',
                                                                'convert_to_draft': '📝',
                                                                'ready_for_review': '✅',
                                                                'closed': '❌',
                                                                'reopened': '🔄',
                                                                'merged': '🔀',
                                                                'committed': '📝'
                                                            };
                                                            return iconMap[eventType] || '📌';
                                                        };

                                                        // Helper function to get event description
                                                        const getEventDescription = (event) => {
                                                            switch (event.event) {
                                                                case 'commented':
                                                                    return 'commented';
                                                                case 'review_comment':
                                                                    return event.path ? `commented on ${event.path}` : 'left a review comment';
                                                                case 'reviewed':
                                                                    if (event.state === 'approved') return 'approved';
                                                                    if (event.state === 'changes_requested') return 'requested changes';
                                                                    return 'reviewed';
                                                                case 'review_requested':
                                                                    return `requested review from ${event.review_requester?.login || 'someone'}`;
                                                                case 'labeled':
                                                                    return `added the ${event.label?.name || 'label'}`;
                                                                case 'unlabeled':
                                                                    return `removed the ${event.label?.name || 'label'}`;
                                                                case 'assigned':
                                                                    return `assigned ${event.assignee?.login || 'someone'}`;
                                                                case 'unassigned':
                                                                    return `unassigned ${event.assignee?.login || 'someone'}`;
                                                                case 'milestoned':
                                                                    return `added to milestone ${event.milestone?.title || ''}`;
                                                                case 'demilestoned':
                                                                    return `removed from milestone`;
                                                                case 'renamed':
                                                                    return `renamed from "${event.rename?.from}" to "${event.rename?.to}"`;
                                                                case 'head_ref_deleted':
                                                                    return 'deleted the head branch';
                                                                case 'head_ref_restored':
                                                                    return 'restored the head branch';
                                                                case 'convert_to_draft':
                                                                    return 'converted to draft';
                                                                case 'ready_for_review':
                                                                    return 'marked as ready for review';
                                                                case 'closed':
                                                                    return 'closed this';
                                                                case 'reopened':
                                                                    return 'reopened this';
                                                                case 'merged':
                                                                    return 'merged this';
                                                                case 'committed':
                                                                    return `added ${event.sha?.substring(0, 7) || 'commit'}`;
                                                                default:
                                                                    return event.event || 'activity';
                                                            }
                                                        };

                                                        return (
                                                            <div key={event.id || index} style={{
                                                                display: 'flex',
                                                                gap: '1rem',
                                                                marginBottom: '1.5rem',
                                                                position: 'relative'
                                                            }}>
                                                                {/* Timeline line */}
                                                                {index < timeline.length - 1 && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: '15px',
                                                                        top: '32px',
                                                                        bottom: '-24px',
                                                                        width: '2px',
                                                                        background: 'var(--border)'
                                                                    }}></div>
                                                                )}

                                                                {/* Event icon */}
                                                                <div style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    background: 'var(--secondary)',
                                                                    border: '2px solid var(--border)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '1rem',
                                                                    flexShrink: 0,
                                                                    position: 'relative',
                                                                    zIndex: 1
                                                                }}>
                                                                    {getEventIcon(event.event)}
                                                                </div>

                                                                {/* Event content */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                                                        {event.user?.avatar_url && (
                                                                            <img
                                                                                src={event.user.avatar_url}
                                                                                alt={event.user.login}
                                                                                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                                                            />
                                                                        )}
                                                                        {event.actor?.avatar_url && !event.user && (
                                                                            <img
                                                                                src={event.actor.avatar_url}
                                                                                alt={event.actor.login}
                                                                                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                                                            />
                                                                        )}
                                                                        <strong>{event.user?.login || event.actor?.login || 'Unknown'}</strong>
                                                                        <span style={{ color: '#888' }}>{getEventDescription(event)}</span>
                                                                        {event.label && (
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                background: event.label.color ? `#${event.label.color}20` : '#ddd',
                                                                                color: event.label.color ? `#${event.label.color}` : '#666',
                                                                                border: `1px solid ${event.label.color ? `#${event.label.color}` : '#999'}`
                                                                            }}>
                                                                                {event.label.name}
                                                                            </span>
                                                                        )}
                                                                        <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: 'auto' }}>
                                                                            {new Date(event.created_at || event.submitted_at).toLocaleString('ja-JP', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    {event.body && (
                                                                        <div style={{
                                                                            marginTop: '0.5rem',
                                                                            padding: '0.75rem',
                                                                            background: 'var(--secondary)',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid var(--border)'
                                                                        }}>
                                                                            <ReactMarkdown>{event.body}</ReactMarkdown>
                                                                        </div>
                                                                    )}
                                                                    {event.state && event.event === 'reviewed' && (
                                                                        <div style={{
                                                                            marginTop: '0.5rem',
                                                                            fontSize: '0.85rem',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '12px',
                                                                            display: 'inline-block',
                                                                            background: event.state === 'approved' ? 'rgba(46, 164, 79, 0.2)' :
                                                                                event.state === 'changes_requested' ? 'rgba(203, 36, 49, 0.2)' :
                                                                                    'rgba(155, 155, 155, 0.2)',
                                                                            color: event.state === 'approved' ? '#2ea44f' :
                                                                                event.state === 'changes_requested' ? '#cb2431' : '#666',
                                                                            fontWeight: '500'
                                                                        }}>
                                                                            {event.state === 'approved' ? '✓ Approved' :
                                                                                event.state === 'changes_requested' ? '✗ Changes Requested' :
                                                                                    event.state === 'commented' ? '💬 Commented' : event.state}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                            ) : (
                                                <p style={{ color: '#888' }}>No conversation yet.</p>
                                            )}

                                        </>
                                    )
                                    }

                                    {
                                        activeTab === 'commits' && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <h4 style={{ marginBottom: '1rem' }}>Commits</h4>
                                                {loadingCommits ? (
                                                    <p>Loading commits...</p>
                                                ) : commits.length > 0 ? (
                                                    commits.map((commit, index) => (
                                                        <div key={index}>
                                                            <div
                                                                onClick={() => handleCommitClick(commit)}
                                                                style={{
                                                                    background: selectedCommit?.sha === commit.sha ? 'rgba(255, 107, 53, 0.1)' : 'var(--secondary)',
                                                                    padding: '1rem',
                                                                    borderRadius: '8px',
                                                                    marginBottom: '0.75rem',
                                                                    border: selectedCommit?.sha === commit.sha ? '1px solid #FF6B35' : '1px solid var(--border)',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                    {commit.author?.avatar_url && (
                                                                        <img
                                                                            src={commit.author.avatar_url}
                                                                            alt={commit.author.login}
                                                                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                                                                        />
                                                                    )}
                                                                    <strong>{commit.author?.login || commit.commit.author.name}</strong>
                                                                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                                                                        {new Date(commit.commit.author.date).toLocaleString('ja-JP')}
                                                                    </span>
                                                                </div>
                                                                <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                                                                    {commit.commit.message.split('\n')[0]}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    <span style={{
                                                                        fontSize: '0.85rem',
                                                                        color: '#888',
                                                                        fontFamily: 'monospace'
                                                                    }}>
                                                                        {commit.sha.substring(0, 7)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                                        Click to view changes
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Expanded commit details */}
                                                            {selectedCommit?.sha === commit.sha && commitDetails && (
                                                                <div style={{
                                                                    marginBottom: '1rem',
                                                                    padding: '1rem',
                                                                    background: 'var(--card-bg)',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid var(--border)'
                                                                }}>
                                                                    {loadingCommitDetails ? (
                                                                        <p>Loading commit details...</p>
                                                                    ) : (
                                                                        <>
                                                                            <h5 style={{ marginBottom: '0.75rem' }}>Files Changed ({commitDetails.files?.length || 0})</h5>
                                                                            {commitDetails.files?.map((file, fileIdx) => (
                                                                                <div key={fileIdx} style={{
                                                                                    background: 'var(--secondary)',
                                                                                    padding: '0.75rem',
                                                                                    borderRadius: '6px',
                                                                                    marginBottom: '0.75rem'
                                                                                }}>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                                        <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{file.filename}</span>
                                                                                        <span style={{ fontSize: '0.85rem' }}>
                                                                                            <span style={{ color: '#2ea44f' }}>+{file.additions}</span> /
                                                                                            <span style={{ color: '#cb2431' }}> -{file.deletions}</span>
                                                                                        </span>
                                                                                    </div>
                                                                                    {file.patch && (
                                                                                        <div style={{
                                                                                            fontSize: '0.85rem',
                                                                                            fontFamily: 'monospace',
                                                                                            background: '#000',
                                                                                            color: '#fff',
                                                                                            padding: '0.5rem',
                                                                                            borderRadius: '4px',
                                                                                            overflow: 'auto',
                                                                                            maxHeight: '200px'
                                                                                        }}>
                                                                                            {file.patch.split('\n').map((line, idx) => {
                                                                                                let bgColor = 'transparent';
                                                                                                if (line.startsWith('+') && !line.startsWith('+++')) {
                                                                                                    bgColor = 'rgba(46, 164, 79, 0.3)';
                                                                                                } else if (line.startsWith('-') && !line.startsWith('---')) {
                                                                                                    bgColor = 'rgba(203, 36, 49, 0.3)';
                                                                                                }
                                                                                                return (
                                                                                                    <div key={idx} style={{ backgroundColor: bgColor }}>
                                                                                                        {line}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p style={{ color: '#888' }}>No commits found.</p>
                                                )}
                                            </div>
                                        )
                                    }
                                </div >

                                {
                                    !isMobile && (
                                        <div className={styles.modalSideColumn} style={{ overflowY: 'auto', height: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                <h4 className={styles.sideTitle}>Related Tickets{relatedTickets.length > 0 && ` (${relatedTickets.length})`}</h4>
                                            </div>
                                            {loadingTickets ? (
                                                <p className={styles.loadingText}>Loading...</p>
                                            ) : relatedTickets.length > 0 ? (
                                                <div className={styles.ticketList}>
                                                    {relatedTickets.map(ticket => (
                                                        <div key={ticket.id} className={styles.ticketItem} style={{ cursor: 'pointer' }} onClick={() => onTicketClick && onTicketClick(ticket)}>
                                                            <span className={styles.ticketId}>#{ticket.id}</span>
                                                            <p className={styles.ticketSubject}>{ticket.subject}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={styles.noDataText}>No related tickets found.</p>
                                            )}
                                        </div>
                                    )
                                }

                                {/* Mobile/Tablet Related Tickets - sticky at bottom */}
                                {
                                    isMobile && (
                                        <div style={{
                                            position: 'fixed',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'var(--card-bg)',
                                            borderTop: '2px solid var(--border)',
                                            padding: '1rem',
                                            zIndex: 100,
                                            boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            <div
                                                onClick={() => setRelatedTicketsExpanded(!relatedTicketsExpanded)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    marginBottom: relatedTicketsExpanded ? '0.75rem' : '0',
                                                    padding: '0.5rem 0'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>
                                                    {relatedTicketsExpanded ? '▼' : '▶'}
                                                </span>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                                    Related Tickets{relatedTickets.length > 0 && ` (${relatedTickets.length})`}
                                                </h4>
                                            </div>
                                            {relatedTicketsExpanded && (
                                                <div style={{
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    background: 'var(--background)'
                                                }}>
                                                    {loadingTickets ? (
                                                        <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading...</p>
                                                    ) : relatedTickets.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {relatedTickets.map(ticket => (
                                                                <div
                                                                    key={ticket.id}
                                                                    onClick={() => onTicketClick && onTicketClick(ticket)}
                                                                    style={{
                                                                        padding: '0.75rem',
                                                                        background: 'var(--secondary)',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid var(--border)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                                                                        #{ticket.id}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                                                        {ticket.subject}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ color: '#888', fontSize: '0.9rem' }}>No related tickets found.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            </div >
                        </div >

                    </div >
                </div >
            )
            }
        </div >
    );
};

export default GitHubPRWidget;
