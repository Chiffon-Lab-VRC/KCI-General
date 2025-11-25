"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

import ReactMarkdown from 'react-markdown';

const GitHubPRWidget = () => {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPR, setSelectedPR] = useState(null);
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [relatedTickets, setRelatedTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [sortBy, setSortBy] = useState('time'); // 'time' or 'label'
    const [filterLabel, setFilterLabel] = useState('all'); // 'all' or specific label

    useEffect(() => {
        fetchPRs();
    }, []);

    const fetchPRs = () => {
        fetch('/api/github/pulls')
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

    if (loading) return <div className={styles.widget}>Loading PRs...</div>;

    // フィルタリング処理
    const filteredPRs = filterLabel === 'all'
        ? prs
        : prs.filter(pr => pr.labels && pr.labels.some(label => label.name === filterLabel));

    // ソート処理
    const sortedPRs = [...filteredPRs].sort((a, b) => {
        if (sortBy === 'label') {
            // ラベルがない場合は後ろに
            const aLabel = a.labels && a.labels.length > 0 ? a.labels[0].name : 'zzz';
            const bLabel = b.labels && b.labels.length > 0 ? b.labels[0].name : 'zzz';
            return aLabel.localeCompare(bLabel);
        }
        // デフォルト: 時系列順（番号の降順 = 新しい順）
        return b.number - a.number;
    });

    // ユニークなラベルリストを取得
    const allLabels = prs.flatMap(pr => pr.labels || []);
    const uniqueLabels = [...new Set(allLabels.map(label => label.name))].sort();

    return (
        <div className={styles.widget}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>GitHub Pull Requests ({sortedPRs.length})</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                        <option value="label">ラベル順</option>
                    </select>
                </div>
            </div>
            <div className={styles.scrollableList}>
                {sortedPRs.map(pr => (
                    <div key={pr.number} onClick={() => handlePRClick(pr)} className={styles.itemLink} style={{ cursor: 'pointer' }}>
                        <div className={styles.compactItem}>
                            <div className={styles.compactHeader}>
                                <span className={styles.id}>#{pr.number}</span>
                                <span className={styles.status} style={{ background: '#2ea44f' }}>Open</span>
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

                        <div className={styles.modalContentGrid}>
                            <div className={styles.modalMainColumn}>
                                <div className={styles.markdownContent}>
                                    <ReactMarkdown>{selectedPR.body || "No description provided."}</ReactMarkdown>
                                </div>

                                <div className={styles.filesSection}>
                                    <h4 className={styles.filesTitle}>Files Changed</h4>
                                    {loadingFiles ? (
                                        <p>Loading files...</p>
                                    ) : (
                                        files.map((file, index) => (
                                            <div key={index} className={styles.fileItem}>
                                                <div className={styles.fileHeader}>
                                                    <span>{file.filename}</span>
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
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalSideColumn}>
                                <h4 className={styles.sideTitle}>Related Tickets</h4>
                                {loadingTickets ? (
                                    <p className={styles.loadingText}>Searching...</p>
                                ) : relatedTickets.length > 0 ? (
                                    <div className={styles.ticketList}>
                                        {relatedTickets.map(ticket => (
                                            <a key={ticket.id} href={ticket.uiUrl || ticket.url} target="_blank" rel="noopener noreferrer" className={styles.ticketItem}>
                                                <span className={styles.ticketId}>#{ticket.id}</span>
                                                <p className={styles.ticketSubject}>{ticket.subject}</p>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.noDataText}>No related tickets found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitHubPRWidget;
