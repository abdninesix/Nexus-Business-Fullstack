// src/components/deals/TransactionList.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fetchTransactionsForDeal, Transaction } from '../../api/deals';
import { DollarSign } from 'lucide-react';

interface TransactionListProps {
    dealId: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ dealId }) => {
    const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
        queryKey: ['transactions', dealId], // Key is specific to this deal
        queryFn: () => fetchTransactionsForDeal(dealId),
        enabled: !!dealId,
    });

    if (isLoading) return <p className="text-sm text-gray-500">Loading payment history...</p>;
    if (transactions.length === 0) return <p className="text-sm text-gray-500">No payments have been made for this deal yet.</p>;

    return (
        <div className="space-y-3 mt-4">
            <h3 className="text-md font-semibold text-gray-900">Payment History</h3>
            <ul className="divide-y divide-gray-200">
                {transactions.map(tx => (
                    <li key={tx._id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-full mr-3"><DollarSign size={16} className="text-green-600" /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}</p>
                                <p className="text-xs text-gray-500">{tx.notes}</p>
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};