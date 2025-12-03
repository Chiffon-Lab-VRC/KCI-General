'use client';

import styles from './Sidebar.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <nav className={styles.nav}>
                <Link href="/gantt" className={`${styles.navItem} ${pathname === '/gantt' ? styles.active : ''}`}>
                    <span className={styles.icon}>📊</span>
                    <span className={styles.label}>Gantt</span>
                </Link>
            </nav>
        </aside>
    );
};

export default Sidebar;
