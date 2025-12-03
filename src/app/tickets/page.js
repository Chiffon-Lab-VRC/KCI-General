'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TicketList from '@/components/TicketList';
import TicketDetail from '@/components/TicketDetail';
import CreateTicketModal from '@/components/CreateTicketModal';
import styles from '@/app/tickets/tickets.module.css';

export default function TicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        status: 'all',
        assignee: 'all'
    });

    // チケット一覧とユーザー一覧の取得
    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsRes, usersRes] = await Promise.all([
                fetch('/api/redmine/issues'),
                fetch('/api/redmine/users')
            ]);

            if (ticketsRes.ok) {
                const data = await ticketsRes.json();
                setTickets(data.issues || []);
            }

            if (usersRes.ok) {
                const data = await usersRes.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 検索とフィルタリング
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(ticket.id).includes(searchQuery);

        const matchesStatus = filters.status === 'all' || ticket.status.name === filters.status;

        const matchesAssignee = filters.assignee === 'all' ||
            (filters.assignee === 'unassigned' && !ticket.assigned_to) ||
            (ticket.assigned_to?.id === Number(filters.assignee));

        return matchesSearch && matchesStatus && matchesAssignee;
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // チケット作成ハンドラ
    const handleCreateTicket = async (newTicketData) => {
        const res = await fetch('/api/redmine/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTicketData)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '作成に失敗しました');
        }

        const data = await res.json();
        // リストを更新して新しいチケットを選択
        await fetchData();

        if (data.issue) {
            setSelectedTicket(data.issue);
        }
    };

    // チケット更新ハンドラ
    const handleUpdateTicket = async (id, updates) => {
        const res = await fetch(`/api/redmine/issues/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '更新に失敗しました');
        }

        // リストを更新
        await fetchData();

        // 選択中のチケット情報も更新
        const resDetail = await fetch(`/api/redmine/issues/${id}`);
        if (resDetail.ok) {
            const detailData = await resDetail.json();
            setSelectedTicket(detailData.issue);
        }
    };

    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.content}>
                    <TicketList
                        tickets={filteredTickets}
                        selectedId={selectedTicket?.id}
                        onSelect={setSelectedTicket}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onCreateClick={() => setShowCreateModal(true)}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        users={users}
                    />
                    <TicketDetail
                        ticket={selectedTicket}
                        onUpdate={handleUpdateTicket}
                    />
                </div>
            </div>

            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateTicket}
                />
            )}
        </>
    );
}
