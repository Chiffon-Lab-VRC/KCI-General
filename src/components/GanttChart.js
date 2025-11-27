'use client';

import { useRef, useState } from 'react';
import styles from './GanttChart.module.css';

const GanttChart = ({ tickets, view, selectedMonth }) => {
    const treeRef = useRef(null);
    const chartRef = useRef(null);
    const [expandedTickets, setExpandedTickets] = useState({});
    const [visibleColumns, setVisibleColumns] = useState({
        subject: true,
        assignedTo: true,
        doneRatio: true
    });

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const buildHierarchy = (tickets) => {
        const ticketMap = {};
        const rootTickets = [];

        tickets.forEach(ticket => {
            ticketMap[ticket.id] = { ...ticket, children: [] };
        });

        tickets.forEach(ticket => {
            if (ticket.parent && ticket.parent.id && ticketMap[ticket.parent.id]) {
                ticketMap[ticket.parent.id].children.push(ticketMap[ticket.id]);
            } else {
                rootTickets.push(ticketMap[ticket.id]);
            }
        });

        return rootTickets;
    };

    const hierarchicalTickets = buildHierarchy(tickets);

    const syncScroll = (source) => {
        if (source === 'tree' && treeRef.current && chartRef.current) {
            chartRef.current.scrollTop = treeRef.current.scrollTop;
        } else if (source === 'chart' && treeRef.current && chartRef.current) {
            treeRef.current.scrollTop = chartRef.current.scrollTop;
        }
    };

    const toggleExpanded = (ticketId) => {
        setExpandedTickets(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }));
    };

    const calculateDateRange = () => {
        if (tickets.length === 0) return { startDate: new Date(), endDate: new Date(), days: [], months: [] };

        let minDate = null;
        let maxDate = null;

        if (view === 'monthly' && selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            minDate = new Date(year, month - 1, 1);
            maxDate = new Date(year, month, 0);
        } else if (view === 'master') {
            minDate = new Date(2025, 3, 1);
            maxDate = new Date(2026, 3, 0);
        } else {
            tickets.forEach(ticket => {
                const start = ticket.start_date ? new Date(ticket.start_date) : null;
                const due = ticket.due_date ? new Date(ticket.due_date) : null;

                if (start && (!minDate || start < minDate)) minDate = start;
                if (due && (!maxDate || due > maxDate)) maxDate = due;
            });

            if (!minDate || !maxDate) {
                const now = new Date();
                minDate = new Date(now.getFullYear(), now.getMonth(), 1);
                maxDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }

            minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
        }

        const days = [];
        const months = [];

        if (view === 'monthly') {
            const current = new Date(minDate);
            while (current <= maxDate) {
                days.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else {
            const current = new Date(minDate);
            for (let i = 0; i < 12; i++) {
                months.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
            }
        }

        return { startDate: minDate, endDate: maxDate, days, months };
    };

    const { startDate, endDate, days, months } = calculateDateRange();

    const calculateBarStyle = (startDateStr, endDateStr) => {
        if (!startDateStr || !endDateStr) return null;

        // 日付文字列をパースしてローカルタイムのDateオブジェクトを作成
        const parseDate = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        let start = parseDate(startDateStr.split('T')[0]);
        let end = parseDate(endDateStr.split('T')[0]);

        if (view === 'monthly' && selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);

            if (start < monthStart) start = monthStart;
            if (end > monthEnd) end = monthEnd;

            if (start > end) return null;
        }

        if (view === 'master') {
            const totalMonths = months.length;

            const startMonthIndex = (start.getFullYear() - startDate.getFullYear()) * 12 +
                (start.getMonth() - startDate.getMonth());

            const endMonthIndex = (end.getFullYear() - startDate.getFullYear()) * 12 +
                (end.getMonth() - startDate.getMonth());

            const duration = Math.max(1, endMonthIndex - startMonthIndex + 1);

            const left = Math.max(0, (startMonthIndex / totalMonths) * 100);
            const width = Math.min(100 - left, (duration / totalMonths) * 100);

            return {
                left: `${left}%`,
                width: `${width}%`
            };
        } else {
            const totalDays = days.length;
            // 日付の差分を計算（ミリ秒単位の計算誤差を防ぐため、日付の差分で計算）
            const startDay = Math.round((start - startDate) / (1000 * 60 * 60 * 24));
            const duration = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

            const left = (startDay / totalDays) * 100;
            const width = (duration / totalDays) * 100;

            return {
                left: `${Math.max(0, left)}%`,
                width: `${Math.min(100 - left, width)}%`
            };
        }
    };

    // カラムの幅定義
    const COLUMN_WIDTHS = {
        id: 80,
        subject: visibleColumns.subject ? 400 : 40,
        assignedTo: visibleColumns.assignedTo ? 120 : 40,
        doneRatio: visibleColumns.doneRatio ? 100 : 40
    };

    const getSidebarWidth = () => {
        return COLUMN_WIDTHS.id + COLUMN_WIDTHS.subject + COLUMN_WIDTHS.assignedTo + COLUMN_WIDTHS.doneRatio;
    };

    const DAY_WIDTH = 50; // 月次ビューの日付セル幅

    const getTimelineWidth = () => {
        if (view === 'monthly') {
            return days.length * DAY_WIDTH;
        }
        return '100%';
    };

    const renderGridBackground = () => {
        if (view === 'monthly') {
            return (
                <div className={styles.gridBackground}>
                    {days.map((_, index) => (
                        <div
                            key={index}
                            className={styles.gridLine}
                            style={{ width: `${DAY_WIDTH}px`, minWidth: `${DAY_WIDTH}px` }}
                        />
                    ))}
                </div>
            );
        } else {
            return (
                <div className={styles.gridBackground}>
                    {months.map((_, index) => (
                        <div
                            key={index}
                            className={styles.gridLine}
                            style={{ flex: 1 }}
                        />
                    ))}
                </div>
            );
        }
    };

    const renderTicketTree = (ticket, level = 0) => {
        const hasChildren = ticket.children && ticket.children.length > 0;
        const isExpanded = expandedTickets[ticket.id] !== false;

        return (
            <>
                <div key={`tree-${ticket.id}`} className={styles.treeRow}>
                    <div className={styles.treeCell} style={{ width: `${COLUMN_WIDTHS.id}px`, minWidth: `${COLUMN_WIDTHS.id}px` }}>
                        #{ticket.id}
                    </div>

                    {/* 件名 */}
                    <div
                        className={styles.treeCell}
                        style={{
                            width: `${COLUMN_WIDTHS.subject}px`,
                            minWidth: `${COLUMN_WIDTHS.subject}px`,
                            paddingLeft: visibleColumns.subject ? `${level * 1.5 + 0.75}rem` : '0.5rem',
                            cursor: hasChildren ? 'pointer' : 'default',
                            overflow: 'hidden',
                            transition: 'all 0.3s'
                        }}
                        title={ticket.subject}
                        onClick={() => hasChildren && toggleExpanded(ticket.id)}
                    >
                        {visibleColumns.subject ? (
                            <>
                                {hasChildren && (
                                    <span style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                )}
                                {ticket.subject}
                            </>
                        ) : (
                            <span style={{ color: '#888' }}>...</span>
                        )}
                    </div>

                    {/* 担当者 */}
                    <div
                        className={styles.treeCell}
                        style={{
                            width: `${COLUMN_WIDTHS.assignedTo}px`,
                            minWidth: `${COLUMN_WIDTHS.assignedTo}px`,
                            transition: 'all 0.3s',
                            textAlign: visibleColumns.assignedTo ? 'left' : 'center'
                        }}
                    >
                        {visibleColumns.assignedTo ? (ticket.assigned_to?.name || '-') : '...'}
                    </div>

                    {/* 進捗率 */}
                    <div
                        className={styles.treeCell}
                        style={{
                            width: `${COLUMN_WIDTHS.doneRatio}px`,
                            minWidth: `${COLUMN_WIDTHS.doneRatio}px`,
                            transition: 'all 0.3s',
                            textAlign: visibleColumns.doneRatio ? 'left' : 'center'
                        }}
                    >
                        {visibleColumns.doneRatio ? (ticket.done_ratio !== undefined ? `${ticket.done_ratio}%` : '-') : '...'}
                    </div>
                </div>
                {hasChildren && isExpanded && ticket.children.map(child => renderTicketTree(child, level + 1))}
            </>
        );
    };

    const renderTicketBars = (ticket) => {
        const hasChildren = ticket.children && ticket.children.length > 0;
        const isExpanded = expandedTickets[ticket.id] !== false;

        return (
            <>
                <div key={`bar-${ticket.id}`} className={styles.timelineRow} style={{ width: view === 'monthly' ? `${getTimelineWidth()}px` : '100%' }}>
                    {renderGridBackground()}
                    {ticket.start_date && ticket.due_date && (
                        <div
                            className={`${styles.bar} ${styles.plannedBar}`}
                            style={calculateBarStyle(ticket.start_date, ticket.due_date)}
                            title={`予定: ${ticket.start_date} ～ ${ticket.due_date}`}
                        >
                            <span className={styles.barLabel}>予定</span>
                        </div>
                    )}
                    {ticket.start_date && ticket.done_ratio > 0 && (
                        <div
                            className={`${styles.bar} ${styles.actualBar}`}
                            style={{
                                ...calculateBarStyle(ticket.start_date, ticket.due_date || ticket.start_date),
                                width: `calc(${calculateBarStyle(ticket.start_date, ticket.due_date || ticket.start_date)?.width} * ${ticket.done_ratio / 100})`
                            }}
                            title={`実績: ${ticket.done_ratio}%完了`}
                        >
                            <span className={styles.barLabel}>実績</span>
                        </div>
                    )}
                </div>
                {hasChildren && isExpanded && ticket.children.map(child => renderTicketBars(child))}
            </>
        );
    };

    if (tickets.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>表示するチケットがありません</p>
            </div>
        );
    }

    return (
        <div className={styles.ganttContainer}>
            <div
                className={styles.ticketTree}
                ref={treeRef}
                onScroll={() => syncScroll('tree')}
                style={{
                    width: `${getSidebarWidth()}px`,
                    minWidth: `${getSidebarWidth()}px`,
                    transition: 'width 0.3s'
                }}
            >
                <div className={styles.treeHeader}>
                    <div className={styles.headerCell} style={{ width: `${COLUMN_WIDTHS.id}px`, minWidth: `${COLUMN_WIDTHS.id}px` }}>チケット</div>

                    <div
                        className={styles.headerCell}
                        style={{
                            width: `${COLUMN_WIDTHS.subject}px`,
                            minWidth: `${COLUMN_WIDTHS.subject}px`,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => toggleColumn('subject')}
                        title="クリックして折りたたみ/展開"
                    >
                        {visibleColumns.subject ? '件名 [-]' : '[+]'}
                    </div>

                    <div
                        className={styles.headerCell}
                        style={{
                            width: `${COLUMN_WIDTHS.assignedTo}px`,
                            minWidth: `${COLUMN_WIDTHS.assignedTo}px`,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => toggleColumn('assignedTo')}
                        title="クリックして折りたたみ/展開"
                    >
                        {visibleColumns.assignedTo ? '担当者 [-]' : '[+]'}
                    </div>

                    <div
                        className={styles.headerCell}
                        style={{
                            width: `${COLUMN_WIDTHS.doneRatio}px`,
                            minWidth: `${COLUMN_WIDTHS.doneRatio}px`,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onClick={() => toggleColumn('doneRatio')}
                        title="クリックして折りたたみ/展開"
                    >
                        {visibleColumns.doneRatio ? '進捗率 [-]' : '[+]'}
                    </div>
                </div>
                <div className={styles.treeBody}>
                    {hierarchicalTickets.map(ticket => renderTicketTree(ticket, 0))}
                </div>
            </div>

            <div
                className={styles.timelineContainer}
                ref={chartRef}
                onScroll={() => syncScroll('chart')}
            >
                <div className={styles.timelineHeader} style={{ width: view === 'monthly' ? `${getTimelineWidth()}px` : '100%' }}>
                    {view === 'master' ? (
                        months.map((month, index) => (
                            <div key={index} className={styles.monthHeader}>
                                <div className={styles.monthYearLabel}>
                                    {month.getFullYear()}年
                                </div>
                                <div className={styles.monthNameLabel}>
                                    {month.getMonth() + 1}月
                                </div>
                            </div>
                        ))
                    ) : (
                        days.map((day, index) => (
                            <div key={index} className={styles.dayHeader}>
                                <div className={styles.dayNumber}>{day.getDate()}</div>
                                {day.getDate() === 1 && (
                                    <div className={styles.monthLabel}>
                                        {day.getMonth() + 1}月
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div className={styles.timelineBody}>
                    {hierarchicalTickets.map(ticket => renderTicketBars(ticket))}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
