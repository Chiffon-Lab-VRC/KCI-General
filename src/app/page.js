"use client";
import RedmineWidget from "@/components/RedmineWidget";
import GitHubWidget from "@/components/GitHubWidget";
import GitHubPRWidget from "@/components/GitHubPRWidget";
import styles from "./page.module.css";

export default function Home() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/kci-logo.png" alt="KCI Logo" style={{ height: '100px', width: 'auto' }} />
          <div>
            <h1>KCI Task Manager</h1>
            <p>Real-time status of the current project.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#FF6B35',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(255, 107, 53, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.background = '#FF5722'}
          onMouseOut={(e) => e.target.style.background = '#FF6B35'}
        >
          最新の情報に更新
        </button>
      </header>

      <div className={styles.dashboardGrid}>
        <RedmineWidget />
        <GitHubPRWidget />
        <GitHubWidget />
      </div>
    </main>
  );
}
