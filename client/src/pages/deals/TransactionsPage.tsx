// src/pages/transactions/TransactionsPage.tsx
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
// 1. Import new icons
import { DollarSign, Receipt, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { fetchSentTransactions, fetchReceivedTransactions, Transaction } from '../../api/deals';
import { Input } from '../../components/ui/Input';

// Helper to format currency
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export const TransactionsPage: React.FC = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const isInvestor = user?.role === 'investor';
    const queryKey = isInvestor ? 'sentTransactions' : 'receivedTransactions';
    const queryFn = isInvestor ? fetchSentTransactions : fetchReceivedTransactions;

    const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
        queryKey: [queryKey],
        queryFn: queryFn,
        enabled: !!user,
    });

    // --- 2. DERIVE STATS and FILTERED DATA ---
    const { totalAmount, filteredTransactions } = useMemo(() => {
        const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

        const filtered = transactions.filter(tx =>
            tx.dealId?.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (isInvestor
                ? tx.dealId?.entrepreneurId?.name.toLowerCase().includes(searchQuery.toLowerCase())
                : tx.dealId?.investorId?.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return { totalAmount: total, filteredTransactions: filtered };
    }, [transactions, searchQuery, isInvestor]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-gray-600">A complete record of all your payments.</p>
            </div>

            {/* --- 3. ADDED SUMMARY CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg mr-3"><DollarSign size={20} className="text-green-600" /></div>
                        <div>
                            <p className="text-sm text-gray-600">{isInvestor ? 'Total Sent' : 'Total Received'}</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg mr-3"><Receipt size={20} className="text-blue-600" /></div>
                        <div>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                            <p className="text-lg font-semibold text-gray-900">{transactions.length}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-medium text-gray-900">All Transactions</h2>
                    {/* --- 4. ADDED SEARCH BAR --- */}
                    <div className="w-full md:w-1/3">
                        <Input
                            placeholder="Search by startup or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            startAdornment={<Search size={18} />}
                            fullWidth
                        />
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isInvestor ? 'To (Startup)' : 'From (Investor)'}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading && <tr><td colSpan={5} className="text-center p-8">Loading history...</td></tr>}
                                {!isLoading && filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap">
                                            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900">No Transactions Found</h3>
                                            <p className="mt-1 text-sm text-gray-500">{searchQuery ? "Try adjusting your search." : "When you send or receive payments, they will appear here."}</p>
                                        </td>
                                    </tr>
                                )}
                                {filteredTransactions.map(tx => {
                                    const dealInfo = tx.dealId;
                                    const otherPartyName = isInvestor ? dealInfo?.entrepreneurId?.name : dealInfo?.investorId?.name;

                                    return (
                                        <tr key={tx._id} className="hover:bg-gray-50">
                                            {/* --- 5. ADDED VISUAL INDICATOR --- */}
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {isInvestor
                                                    ? (<div className='flex gap-1 text-sm text-gray-900'><ArrowUpCircle size={20} className="text-red-500" />Sent</div>)
                                                    : (<div className='flex gap-1 text-sm text-gray-900'><ArrowDownCircle size={20} className="text-green-500" />Recieved</div>)
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowra text-sm text-gray-900p">{format(new Date(tx.date), 'MMM d, yyyy')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-sm text-green-900">{formatCurrency(tx.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap ">
                                                <div className="text-sm text-gray-900 font-medium">{dealInfo?.startupName}</div>
                                                <div className="text-sm text-gray-500">{otherPartyName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{tx.notes || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};