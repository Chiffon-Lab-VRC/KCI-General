'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const Header = ({ onRefresh, showRefresh = true }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const menuItems = [
        { name: 'ダッシュボード', path: '/' },
        { name: 'ガントチャート', path: '/gantt' }
    ];

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* ロゴとタイトル */}
                <div className={styles.brandSection}>
                    <img src="/kci-logo.png" alt="KCI Logo" className={styles.logoImage} />
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>KCI Task Manager</h1>
                        <p className={styles.subtitle}>Real-time status of the current project.</p>
                    </div>
                </div>

                {/* 右側：ナビゲーションとリフレッシュボタン */}
                <div className={styles.rightSection}>
                    {/* リフレッシュボタン */}
                    {showRefresh && onRefresh && (
                        <button
                            onClick={onRefresh}
                            className={styles.refreshButton}
                        >
                            ↺ 最新の情報に更新
                        </button>
                    )}

                    {/* ハンバーガーメニューボタン */}
                    <button
                        className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
                        onClick={toggleMenu}
                        aria-label="メニュー"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* ナビゲーションメニュー */}
                    <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
                        <ul className={styles.navList}>
                            {menuItems.map((item) => (
                                <li key={item.path} className={styles.navItem}>
                                    <Link
                                        href={item.path}
                                        className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
                                        onClick={closeMenu}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* オーバーレイ（モバイル時） */}
                {menuOpen && (
                    <div
                        className={styles.overlay}
                        onClick={closeMenu}
                    ></div>
                )}
            </div>
        </header>
    );
};

export default Header;
