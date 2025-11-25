"use client";
import { useEffect, useState } from 'react';
import styles from './Widget.module.css';

const RedmineWidget = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className={styles.widget}>Loading Tickets...</div>;

    return (
        <div className={styles.widget}>
            <h3 className={styles.title}>Redmine Tickets ({issues.length})</h3>
            <div className={styles.scrollableList}>
                {issues.map(issue => (
                    <a key={issue.id} href={issue.url} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                        <div className={styles.compactItem}>
                            <div className={styles.compactHeader}>
                                <span className={styles.id}>#{issue.id}</span>
                                <span className={`${styles.status} ${styles[issue.status.name.toLowerCase().replace(' ', '-')] || ''}`}>
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
