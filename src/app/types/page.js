'use client';

import TypeViewer from '@/components/TypeViewer';
import Header from '@/components/Header';
import styles from '@/app/page.module.css';

export default function TypesPage() {
    return (
        <>
            <Header showRefresh={false} />
            <main className={styles.main}>
                <div className={styles.container} style={{ padding: 0, maxWidth: 'none' }}>
                    <TypeViewer />
                </div>
            </main>
        </>
    );
}
