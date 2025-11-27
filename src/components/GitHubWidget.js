"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

const GitHubWidget = () => {
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
        <div className={styles.widget}>
            <h3 className={styles.title}>GitHub Activity ({commits.length})</h3>
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
                            <p><strong>Author:</strong> {selectedCommit.commit.author.name}</p>
                            <p><strong>Date:</strong> {new Date(selectedCommit.commit.author.date).toLocaleString()}</p>
                            <p><strong>SHA:</strong> {selectedCommit.sha.substring(0, 7)}</p>

                            {selectedCommit.commit.message.split('\n').length > 1 && (
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
