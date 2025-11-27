'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import GanttChart from '@/components/GanttChart';
import styles from './gantt.module.css';

export default function GanttPage() {
    const [view, setView] = useState('master'); // 'master' or 'monthly'
    const [selectedMonth, setSelectedMonth] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 現在の月を初期値として設定
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
    }, []);

    useEffect(() => {
        fetchGanttData();
    }, [view, selectedMonth]);

    const fetchGanttData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                view: view,
                ...(view === 'monthly' && selectedMonth && { month: selectedMonth })
            });

            const response = await fetch(`/api/redmine/gantt?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch gantt data');
            }

            const data = await response.json();
            setTickets(data.issues || []);
        } catch (error) {
            console.error('Error fetching gantt data:', error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };



    // 月選択用のオプションを生成（過去6ヶ月〜未来6ヶ月）
    const generateMonthOptions = () => {
        const options = [];
        const now = new Date();

        for (let i = -6; i <= 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
            options.push({ value: yearMonth, label });
        }

        return options;
    };

    return (
        <>
            <Header />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>ガントチャート</h1>

                        <div className={styles.controls}>
                            {/* ビュー切り替え */}
                            <div className={styles.viewSwitch}>
                                <button
                                    className={`${styles.viewButton} ${view === 'master' ? styles.active : ''}`}
                                    onClick={() => setView('master')}
                                >
                                    マスタ線表
                                </button>
                                <button
                                    className={`${styles.viewButton} ${view === 'monthly' ? styles.active : ''}`}
                                    onClick={() => setView('monthly')}
                                >
                                    月次詳細線表
                                </button>
                            </div>

                            {/* 月選択（月次詳細ビューの時のみ表示） */}
                            {view === 'monthly' && (
                                <select
                                    className={styles.monthSelect}
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    {generateMonthOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}

                        </div>
                    </div>

                    <div className={styles.content}>
                        {loading ? (
                            <div className={styles.loading}>
                                <p>読み込み中...</p>
                            </div>
                        ) : (
                            <GanttChart
                                tickets={tickets}
                                view={view}
                                selectedMonth={selectedMonth}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
