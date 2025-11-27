"use client";
import { useState, useEffect } from "react";
import RedmineWidget from "@/components/RedmineWidget";
import GitHubWidget from "@/components/GitHubWidget";
import GitHubPRWidget from "@/components/GitHubPRWidget";
import styles from "./page.module.css";

export default function Home() {
  const [selectedRedmineTicket, setSelectedRedmineTicket] = useState(null);
  const [expandedWidgets, setExpandedWidgets] = useState([]); // Array of expanded widget names
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1199); // Include tablets
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTicketClick = (ticket) => {
    setSelectedRedmineTicket(ticket);
  };

  const toggleWidget = (widgetName) => {
    if (!isMobile) return; // Only work on mobile
    setExpandedWidgets(prev => {
      if (prev.includes(widgetName)) {
        // Remove from array if already expanded
        return prev.filter(w => w !== widgetName);
      } else {
        // Add to array if collapsed
        return [...prev, widgetName];
      }
    });
  };

  const expandAll = () => {
    if (!isMobile) return;
    setExpandedWidgets(['redmine', 'github-pr', 'github-activity']); // Expand all widgets
  };

  const collapseAll = () => {
    if (!isMobile) return;
    setExpandedWidgets([]); // Collapse all widgets
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isMobile && (
            <>
              <button
                onClick={expandAll}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#4a9eff',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(74, 158, 255, 0.2)'
                }}
                onMouseOver={(e) => e.target.style.background = '#3a8eef'}
                onMouseOut={(e) => e.target.style.background = '#4a9eff'}
              >
                全部開く
              </button>
              <button
                onClick={collapseAll}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#6c757d',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(108, 117, 125, 0.2)'
                }}
                onMouseOver={(e) => e.target.style.background = '#5c656d'}
                onMouseOut={(e) => e.target.style.background = '#6c757d'}
              >
                全部閉じる
              </button>
            </>
          )}
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
        </div>
      </header>

      <div className={styles.dashboardGrid}>
        <RedmineWidget
          externalSelectedTicket={selectedRedmineTicket}
          onExternalTicketClose={() => setSelectedRedmineTicket(null)}
          isMobile={isMobile}
          isExpanded={!isMobile || expandedWidgets.includes('redmine')}
          onToggle={() => toggleWidget('redmine')}
        />
        <GitHubPRWidget
          onTicketClick={handleTicketClick}
          isMobile={isMobile}
          isExpanded={!isMobile || expandedWidgets.includes('github-pr')}
          onToggle={() => toggleWidget('github-pr')}
        />
        <GitHubWidget
          isMobile={isMobile}
          isExpanded={!isMobile || expandedWidgets.includes('github-activity')}
          onToggle={() => toggleWidget('github-activity')}
        />
      </div>
    </main>
  );
}
