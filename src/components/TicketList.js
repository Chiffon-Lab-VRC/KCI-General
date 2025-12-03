import styles from '@/app/tickets/tickets.module.css';

export default function TicketList({ tickets, onSelect, selectedId, searchQuery, onSearchChange, onCreateClick, filters, onFilterChange, users }) {
    const getStatusClass = (statusName) => {
        if (!statusName) return '';
        const lower = statusName.toLowerCase();
        if (lower.includes('今やってます') || lower.includes('doing')) return styles.status_doing;
        if (lower.includes('レビュー') || lower.includes('req-rev')) return styles.status_review;
        if (lower.includes('新規') || lower.includes('popup')) return styles.status_popup;
        if (lower.includes('保留') || lower.includes('pending')) return styles.status_pending;
        if (lower.includes('直して') || lower.includes('sendback')) return styles.status_sendback;
        if (lower.includes('完了') || lower.includes('finished') || lower.includes('解決')) return styles.status_finished;
        if (lower.includes('中止') || lower.includes('suspended') || lower.includes('終了')) return styles.status_suspended;
        return '';
    };

    return (
        <div className={styles.listPanel}>
            <div className={styles.listHeader}>
                <input
                    type="text"
                    className={styles.searchBox}
                    placeholder="チケットを検索..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />

                {/* フィルタオプション */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <select
                        className={styles.formSelect}
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.25rem' }}
                    >
                        <option value="all">全ステータス</option>
                        <option value="新規タスク[popup]">新規タスク[popup]</option>
                        <option value="今やってます[doing]">今やってます[doing]</option>
                        <option value="保留中[Pending]">保留中[Pending]</option>
                        <option value="レビューお願い[Req-Rev]">レビューお願い[Req-Rev]</option>
                        <option value="直してね[SendBack]">直してね[SendBack]</option>
                        <option value="完了[Finished]">完了[Finished]</option>
                        <option value="中止[Suspended]">中止[Suspended]</option>
                    </select>

                    <select
                        className={styles.formSelect}
                        value={filters.assignee}
                        onChange={(e) => onFilterChange('assignee', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.25rem' }}
                    >
                        <option value="all">全担当者</option>
                        <option value="unassigned">未割り当て</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <button className={styles.createButton} onClick={onCreateClick} style={{ marginTop: '0.5rem' }}>
                    + 新規チケット作成
                </button>
            </div>
            <div className={styles.ticketList}>
                {tickets.length === 0 ? (
                    <div style={{ padding: '1rem', color: '#888', textAlign: 'center' }}>
                        チケットが見つかりません
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className={`${styles.ticketItem} ${selectedId === ticket.id ? styles.active : ''}`}
                            onClick={() => onSelect(ticket)}
                        >
                            <div className={styles.ticketSubject}>{ticket.subject}</div>
                            <div className={styles.ticketMeta}>
                                <span>#{ticket.id} {ticket.assigned_to ? ticket.assigned_to.name : '未割り当て'}</span>
                                <span className={`${styles.statusBadge} ${getStatusClass(ticket.status.name)}`}>
                                    {ticket.status.name}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
