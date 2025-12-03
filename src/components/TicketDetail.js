'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/tickets/tickets.module.css';

export default function TicketDetail({ ticket, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // ユーザー一覧を取得
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/redmine/users');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };
        fetchUsers();
    }, []);

    const [fullTicket, setFullTicket] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [comment, setComment] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    useEffect(() => {
        if (ticket) {
            setEditForm({
                subject: ticket.subject,
                description: ticket.description || '',
                status_id: ticket.status?.id,
                priority_id: ticket.priority?.id,
                assigned_to_id: ticket.assigned_to?.id,
                start_date: ticket.start_date || '',
                due_date: ticket.due_date || '',
                done_ratio: ticket.done_ratio || 0
            });
            setIsEditing(false);
            setFullTicket(null); // Reset full ticket
            fetchTicketDetails(ticket.id);
        }
    }, [ticket]);

    const fetchTicketDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const res = await fetch(`/api/redmine/issues/${id}?include=journals`);
            if (res.ok) {
                const data = await res.json();
                setFullTicket(data.issue);
            }
        } catch (error) {
            console.error('Failed to fetch ticket details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        setAddingComment(true);
        try {
            const res = await fetch(`/api/redmine/issues/${ticket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: comment })
            });
            if (res.ok) {
                setComment('');
                fetchTicketDetails(ticket.id); // Refresh details
            } else {
                throw new Error('Failed to add comment');
            }
        } catch (error) {
            alert('コメントの追加に失敗しました: ' + error.message);
        } finally {
            setAddingComment(false);
        }
    };

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

    if (!ticket) {
        return (
            <div className={styles.detailPanel}>
                <div className={styles.emptyState}>
                    チケットを選択してください
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(ticket.id, editForm);
            setIsEditing(false);
            fetchTicketDetails(ticket.id); // Refresh details after update
        } catch (error) {
            alert('更新に失敗しました: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Use fullTicket for display if available, otherwise fallback to ticket prop
    const displayTicket = fullTicket || ticket;

    return (
        <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
                <div>
                    <div className={styles.detailMeta}>#{displayTicket.id}</div>
                    <div className={styles.detailTitle}>
                        {isEditing ? (
                            <input
                                className={styles.formInput}
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            />
                        ) : displayTicket.subject}
                    </div>
                </div>
                {!isEditing && (
                    <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                        ✎ 編集
                    </button>
                )}
            </div>

            {isEditing ? (
                // 編集モード
                <div className={styles.editForm}>
                    <div className={styles.detailGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>ステータス</label>
                            <select
                                className={styles.formSelect}
                                value={editForm.status_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, status_id: e.target.value })}
                            >
                                <option value="1">新規タスク[popup]</option>
                                <option value="2">今やってます[doing]</option>
                                <option value="3">保留中[Pending]</option>
                                <option value="4">レビューお願い[Req-Rev]</option>
                                <option value="7">直してね[SendBack]</option>
                                <option value="5">完了[Finished]</option>
                                <option value="6">中止[Suspended]</option>
                            </select>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>優先度</label>
                            <select
                                className={styles.formSelect}
                                value={editForm.priority_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, priority_id: e.target.value })}
                            >
                                <option value="1">低め</option>
                                <option value="2">通常</option>
                                <option value="3">高め</option>
                                <option value="4">急いで</option>
                                <option value="5">今すぐ</option>
                            </select>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>担当者</label>
                            <select
                                className={styles.formSelect}
                                value={editForm.assigned_to_id || ''}
                                onChange={(e) => setEditForm({ ...editForm, assigned_to_id: e.target.value })}
                            >
                                <option value="">未割り当て</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>進捗率: {editForm.done_ratio}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                className={styles.formRange}
                                value={editForm.done_ratio}
                                onChange={(e) => setEditForm({ ...editForm, done_ratio: Number(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>開始日</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={editForm.start_date}
                                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>期日</label>
                            <input
                                type="date"
                                className={styles.formInput}
                                value={editForm.due_date}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>説明</label>
                        <textarea
                            className={styles.formTextarea}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button className={styles.cancelButton} onClick={() => setIsEditing(false)}>
                            キャンセル
                        </button>
                        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            ) : (
                // 閲覧モード
                <div>
                    <div className={styles.detailGrid}>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>ステータス</span>
                            <span className={`${styles.value} ${styles.statusBadge} ${getStatusClass(displayTicket.status?.name)}`}>
                                {displayTicket.status?.name}
                            </span>
                        </div>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>優先度</span>
                            <span className={styles.value}>{displayTicket.priority?.name}</span>
                        </div>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>担当者</span>
                            <span className={styles.value}>{displayTicket.assigned_to?.name || '-'}</span>
                        </div>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>進捗率</span>
                            <span className={styles.value}>{displayTicket.done_ratio}%</span>
                        </div>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>開始日</span>
                            <span className={styles.value}>{displayTicket.start_date || '-'}</span>
                        </div>
                        <div className={styles.fieldGroup}>
                            <span className={styles.label}>期日</span>
                            <span className={styles.value}>{displayTicket.due_date || '-'}</span>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <span className={styles.label}>説明</span>
                        <div className={styles.description}>
                            {displayTicket.description || '説明はありません'}
                        </div>
                    </div>

                    {/* コメントセクション */}
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>コメント</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <textarea
                                className={styles.formTextarea}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="コメントを入力..."
                                style={{ minHeight: '80px', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className={styles.saveButton}
                                    onClick={handleAddComment}
                                    disabled={!comment.trim() || addingComment}
                                >
                                    {addingComment ? '送信中...' : 'コメントする'}
                                </button>
                            </div>
                        </div>

                        {loadingDetails ? (
                            <div style={{ color: '#888' }}>読み込み中...</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {fullTicket?.journals?.slice().reverse().map((journal, idx) => (
                                    <div key={idx} style={{
                                        backgroundColor: 'var(--secondary)',
                                        padding: '1rem',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
                                            <strong>{journal.user.name}</strong>
                                            <span>{new Date(journal.created_on).toLocaleString('ja-JP')}</span>
                                        </div>
                                        {journal.notes && (
                                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                {journal.notes}
                                            </div>
                                        )}
                                        {journal.details && journal.details.length > 0 && (
                                            <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', fontSize: '0.85rem', color: '#666' }}>
                                                {journal.details.map((detail, dIdx) => (
                                                    <li key={dIdx}>
                                                        {detail.property === 'attr' ? detail.name : detail.property} が {detail.old_value} から {detail.new_value} に変更されました
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                                {(!fullTicket?.journals || fullTicket.journals.length === 0) && (
                                    <div style={{ color: '#888', fontStyle: 'italic' }}>コメントはありません</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
