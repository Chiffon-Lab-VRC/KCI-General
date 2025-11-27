"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

const GitHubWidget = ({
    isMobile = false,
    isExpanded = true,
    onToggle = null
}) => {
    const [commits, setCommits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCommit, setSelectedCommit] = useState(null);
    const [commitDetails, setCommitDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetch('/api/github/commits')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCommits(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleCommitClick = (commit) => {
        setSelectedCommit(commit);
        setCommitDetails(null);
        setLoadingDetails(true);

        fetch(`/api/github/commits/${commit.sha}`)
            .then(res => res.json())
            .then(data => {
                setCommitDetails(data);
                setLoadingDetails(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingDetails(false);
            });
    };

    if (loading) return <div className={styles.widget}>Loading GitHub...</div>;

    return (
        <div className={styles.widget} style={{ height: isMobile && !isExpanded ? 'auto' : undefined }}>
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
                    GitHub Activity ({commits.length})
                </h3>
            </div>
            {isExpanded && (
                <div className={styles.scrollableList}>
                    {commits.map(item => (
                        <div key={item.sha} onClick={() => handleCommitClick(item)} className={styles.itemLink} style={{ cursor: 'pointer' }}>
                            <div className={styles.compactItem}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                    {item.author?.avatar_url && (
                                        <img
                                            src={item.author.avatar_url}
                                            alt={item.author.login}
                                            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                        />
                                    )}
                                    <span style={{ fontWeight: 'bold' }}>{item.commit.author.name}</span>
                                    {item.branch && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            background: 'rgba(255, 107, 53, 0.2)',
                                            color: '#FF6B35'
                                        }}>
                                            {item.branch}
                                        </span>
                                    )}
                                </div>
                                <div style={{ marginTop: '0.25rem' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: '500' }}>{item.commit.message.split('\n')[0]}</span>
                                </div>
                                <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontFamily: 'monospace' }}>{item.sha.substring(0, 7)}</span>
                                    <span>{new Date(item.commit.author.date).toLocaleString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedCommit && (
                <div className={styles.modalOverlay} onClick={() => setSelectedCommit(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2 className={styles.modalTitle}>{selectedCommit.commit.message.split('\n')[0]}</h2>
                                {selectedCommit.branch && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 107, 53, 0.2)',
                                            color: '#FF6B35'
                                        }}>
                                            Branch: {selectedCommit.branch}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalActions}>
                                <button className={`${styles.button} ${styles.cancelButton}`} onClick={() => setSelectedCommit(null)}>
                                    Close
                                </button>
                                <a
                                    href={selectedCommit.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.button} ${styles.approveButton}`}
                                >
                                    Open on GitHub
                                </a>
                            </div>
                        </div>

                        <div className={styles.modalBody}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
                                    {selectedCommit.author?.avatar_url && (
                                        <img
                                            src={selectedCommit.author.avatar_url}
                                            alt={selectedCommit.author.login}
                                            style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong style={{ fontSize: '1.1rem' }}>{selectedCommit.commit.author.name}</strong>
                                            {selectedCommit.author?.login && (
                                                <span style={{ color: '#888', marginLeft: '0.5rem' }}>@{selectedCommit.author.login}</span>
                                            )}
                                        </div>
                                        <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                            committed {new Date(selectedCommit.commit.author.date).toLocaleString('ja-JP', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1rem',
                                    background: 'var(--secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Commit Message</div>
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        margin: 0,
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem'
                                    }}>
                                        {selectedCommit.commit.message}
                                    </pre>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'var(--secondary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>Commit SHA</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{selectedCommit.sha}</div>
                                    </div>
                                    {commitDetails && commitDetails.stats && (
                                        <>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: 'var(--secondary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>Changes</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                                                    <span style={{ color: '#2ea44f' }}>+{commitDetails.stats.additions}</span>
                                                    {' / '}
                                                    <span style={{ color: '#cb2431' }}>-{commitDetails.stats.deletions}</span>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: 'var(--secondary)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>Files Changed</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{commitDetails.files?.length || 0}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {selectedCommit.commit.message.split('\n').length > 1 && false && (
                                <div style={{ marginTop: '1rem' }}>
                                    <strong>Full Message:</strong>
                                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                        {selectedCommit.commit.message}
                                    </pre>
                                </div>
                            )}

                            {loadingDetails ? (
                                <p style={{ marginTop: '1rem' }}>Loading files...</p>
                            ) : commitDetails && commitDetails.files ? (
                                <div className={styles.filesSection}>
                                    <h4 className={styles.filesTitle}>Files Changed ({commitDetails.files.length})</h4>
                                    {commitDetails.files.map((file, index) => (
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
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GitHubWidget;
