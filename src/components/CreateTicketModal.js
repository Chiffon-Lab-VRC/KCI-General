'use client';

import { useState } from 'react';
import styles from '@/app/tickets/tickets.module.css';

export default function CreateTicketModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        project_id: 1, // KCI-卒業制作プライベートクラウド
        tracker_id: 5, // task
        subject: '',
        description: '',
        status_id: 1, // 新規
        priority_id: 2, // 通常
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        done_ratio: 0
    });
    const [creating, setCreating] = useState(false);

    const handleSubmit = async () => {
        if (!formData.subject) {
            alert('件名は必須です');
            return;
        }

        setCreating(true);
        try {
            await onCreate(formData);
            onClose();
        } catch (error) {
            alert('作成に失敗しました: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.detailTitle}>新規チケット作成</h2>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                <div className={styles.fieldGroup} style={{ marginBottom: '1rem' }}>
                    <label className={styles.label}>件名 <span style={{ color: 'red' }}>*</span></label>
                    <input
                        className={styles.formInput}
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="チケットの件名を入力"
                        autoFocus
                    />
                </div>

                <div className={styles.detailGrid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>トラッカー</label>
                        <select
                            className={styles.formSelect}
                            value={formData.tracker_id}
                            onChange={(e) => setFormData({ ...formData, tracker_id: Number(e.target.value) })}
                        >
                            <option value="5">Task</option>
                            <option value="1">Issue</option>
                            <option value="7">Schedule</option>
                            <option value="2">Main Docs</option>
                            <option value="6">Main Techs</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>ステータス</label>
                        <select
                            className={styles.formSelect}
                            value={formData.status_id}
                            onChange={(e) => setFormData({ ...formData, status_id: Number(e.target.value) })}
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
                            value={formData.priority_id}
                            onChange={(e) => setFormData({ ...formData, priority_id: Number(e.target.value) })}
                        >
                            <option value="1">低め</option>
                            <option value="2">通常</option>
                            <option value="3">高め</option>
                            <option value="4">急いで</option>
                            <option value="5">今すぐ</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>開始日</label>
                        <input
                            type="date"
                            className={styles.formInput}
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>期日</label>
                        <input
                            type="date"
                            className={styles.formInput}
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>説明</label>
                    <textarea
                        className={styles.formTextarea}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="詳細な説明を入力..."
                    />
                </div>

                <div className={styles.formActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        キャンセル
                    </button>
                    <button className={styles.saveButton} onClick={handleSubmit} disabled={creating}>
                        {creating ? '作成中...' : '作成'}
                    </button>
                </div>
            </div>
        </div>
    );
}
