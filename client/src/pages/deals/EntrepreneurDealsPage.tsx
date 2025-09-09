// src/pages/deals/EntrepreneurDealsPage.tsx
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns/format';
import { Search, Filter, DollarSign, TrendingUp, Users, UserCheck, UserX, Calendar } from 'lucide-react';
import Modal from 'react-modal';

import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { fetchReceivedDeals, updateDealStatus, Deal, Transaction, fetchReceivedTransactions } from '../../api/deals';
import { TransactionList } from '../../components/deals/TransactionList';

const modalStyles = {
    overlay: { zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '500px' },
};

export const EntrepreneurDealsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

    const { data: deals = [], isLoading } = useQuery<Deal[]>({
        queryKey: ['receivedDeals'],
        queryFn: fetchReceivedDeals,
    });

    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey: ['receivedTransactions'],
        queryFn: fetchReceivedTransactions,
    });

    const statusUpdateMutation = useMutation({
        mutationFn: updateDealStatus,
        onSuccess: (updatedDeal) => {
            const newStatus = updatedDeal.status === 'Negotiation' ? 'Accepted' : 'Rejected';
            toast.success(`Deal has been ${newStatus}!`);
            queryClient.invalidateQueries({ queryKey: ['receivedDeals'] });
            setSelectedDeal(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Action failed."),
    });

    const handleStatusUpdate = (status: 'accepted' | 'rejected') => {
        if (!selectedDeal) return;
        statusUpdateMutation.mutate({ id: selectedDeal._id, status });
    };

    const filteredDeals = useMemo(() => {
        return deals.filter(deal => {
            const matchesSearch = searchQuery === '' ||
                deal.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                deal.investorId?.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(deal.status);
            return matchesSearch && matchesStatus;
        });
    }, [deals, searchQuery, selectedStatus]);

    const { proposedDealsCount, activeDealsCount, closedDealsCount, totalRaised } = useMemo(() => {
        const proposed = deals.filter(d => d.status === 'Proposed').length;
        const active = deals.filter(d => ['Negotiation', 'Term Sheet', 'Due Diligence'].includes(d.status)).length;
        const closed = deals.filter(d => d.status === 'Closed').length;
        const raised = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        return {
            proposedDealsCount: proposed,
            activeDealsCount: active,
            closedDealsCount: closed,
            totalRaised: raised,
        };
    }, [deals, transactions]);

    // Helper to format large numbers for display
    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value}`;
    };

    const statuses = ['Proposed', 'Negotiation', 'Due Diligence', 'Term Sheet', 'Closed', 'Passed', 'Rejected'];

    const toggleStatus = (status: string) => {
        setSelectedStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Due Diligence':
                return 'primary';
            case 'Term Sheet':
                return 'secondary';
            case 'Negotiation':
                return 'accent';
            case 'Closed':
                return 'success';
            case 'Passed':
                return 'error';
            default:
                return 'gray';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Deal Proposals</h1>
                    <p className="text-gray-600">Review and manage investment offers for your startup.</p>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="p-3 bg-primary-100 rounded-lg mr-3">
                                <DollarSign size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Raised</p>
                                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalRaised)}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="p-3 bg-accent-100 rounded-lg mr-3">
                                <Users size={20} className="text-accent-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">New Proposals</p>
                                <p className="text-lg font-semibold text-gray-900">{proposedDealsCount}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                                <TrendingUp size={20} className="text-secondary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Deals</p>
                                <p className="text-lg font-semibold text-gray-900">{activeDealsCount}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <div className="flex items-center">
                            <div className="p-3 bg-success-100 rounded-lg mr-3">
                                <Calendar size={20} className="text-success-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Closed This Month</p>
                                <p className="text-lg font-semibold text-gray-900">{closedDealsCount}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div>
                    <Input
                        placeholder="Search deals by startup name or industry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startAdornment={<Search size={18} />}
                        fullWidth
                        className='w-full'
                    />
                </div>

                <div>
                    <div className="flex gap-2">
                        <Filter className="text-gray-500 size-18" />Filters:
                        <div className="flex flex-wrap gap-2">
                            {statuses.map(status => (
                                <Badge
                                    key={status}
                                    variant={selectedStatus.includes(status) ? getStatusColor(status) : 'gray'}
                                    className="cursor-pointer"
                                    onClick={() => toggleStatus(status)}
                                >
                                    {status}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DEALS TABLE (matched to investor page) --- */}
            <Card>
                <CardHeader><h2 className="text-lg font-medium">Proposals Received</h2></CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className='border-b border-gray-200'>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading && <tr><td colSpan={7} className="text-center p-4">Loading proposals...</td></tr>}
                                {filteredDeals.map(deal => (
                                    <tr key={deal._id} className={`transition-colors duration-200 ${deal.status === 'Proposed' ? 'bg-primary-100 hover:bg-primary-200' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Avatar src={deal.investorId?.avatarUrl} alt={deal.investorId?.name} size="sm" className="flex-shrink-0" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {deal.startupName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {deal.investorId?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{deal.amount}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{deal.equity}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><Badge variant={getStatusColor(deal.status)}>{deal.status}</Badge></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{deal.stage}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{format(new Date(deal.updatedAt), 'MMM d, yyyy')}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedDeal(deal)}>View</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* --- VIEW DETAILS MODAL (matched to investor page) --- */}
            <Modal isOpen={!!selectedDeal} onRequestClose={() => setSelectedDeal(null)} style={modalStyles}>
                {selectedDeal && (
                    <div className="space-y-4">
                        <div className="pb-2 border-b">
                            <h2 className="text-xl font-bold">Deal Proposal from {selectedDeal.investorId?.name}</h2>
                            <p className="text-sm text-gray-500">For your startup: {selectedDeal.startupName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong className="block text-gray-500">Amount:</strong> {selectedDeal.amount}</div>
                            <div><strong className="block text-gray-500">Equity:</strong> {selectedDeal.equity}</div>
                            <div><strong className="block text-gray-500">Stage:</strong> {selectedDeal.stage}</div>
                            <div><strong className="block text-gray-500">Status:</strong> <Badge variant={getStatusColor(selectedDeal.status)}>{selectedDeal.status}</Badge></div>
                        </div>

                        {['Negotiation', 'Term Sheet', 'Due Diligence', 'Closed'].includes(selectedDeal.status) && (
                            <div className="pt-4 border-t">
                                <TransactionList dealId={selectedDeal._id} />
                            </div>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setSelectedDeal(null)}>Close</Button>
                            {selectedDeal.status === 'Proposed' && (
                                <>
                                    <Button variant="error" onClick={() => handleStatusUpdate('rejected')} isLoading={statusUpdateMutation.isPending} leftIcon={<UserX size={16} />}>Reject</Button>
                                    <Button variant="success" onClick={() => handleStatusUpdate('accepted')} isLoading={statusUpdateMutation.isPending} leftIcon={<UserCheck size={16} />}>Accept</Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};