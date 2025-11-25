import RedmineWidget from "@/components/RedmineWidget";
import GitHubWidget from "@/components/GitHubWidget";
import GitHubPRWidget from "@/components/GitHubPRWidget";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Project Overview</h1>
        <p>Real-time status of the current project.</p>
      </header>

      <div className={styles.dashboardGrid}>
        <RedmineWidget />
        <GitHubPRWidget />
        <GitHubWidget />
      </div>
    </main>
  );
}
