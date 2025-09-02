// src/pages/deals/EntrepreneurDealsPage.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchReceivedDeals, updateDealStatus, Deal } from '../../api/deals';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

export const EntrepreneurDealsPage: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: deals = [], isLoading } = useQuery<Deal[]>({
        queryKey: ['receivedDeals'],
        queryFn: fetchReceivedDeals,
    });
    
    const statusUpdateMutation = useMutation({
        mutationFn: updateDealStatus,
        onSuccess: (data) => {
            toast.success(`Deal has been ${data.status.toLowerCase()}!`);
            queryClient.invalidateQueries({ queryKey: ['receivedDeals'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed.'),
    });

    const handleStatusUpdate = (id: string, status: 'accepted' | 'rejected') => {
        statusUpdateMutation.mutate({ id, status });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Deal Proposals</h1>
                <p className="text-gray-600">Review and respond to investment offers.</p>
            </div>
            
            <Card>
                <CardBody>
                    {isLoading && <p>Loading proposals...</p>}
                    {deals.length === 0 && !isLoading && <p>You have not received any deal proposals yet.</p>}
                    <div className="space-y-4">
                        {deals.map(deal => (
                            <div key={deal._id} className="border p-4 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                        <Avatar src={deal.investorId.avatarUrl} alt={deal.investorId.name} />
                                        <div className="ml-4">
                                            <p className="font-semibold">{deal.investorId.name} has proposed a deal.</p>
                                            <p className="text-sm text-gray-600">Offer: {deal.amount} for {deal.equity}</p>
                                        </div>
                                    </div>
                                    <Badge>{deal.status}</Badge>
                                </div>
                                {deal.status === 'Proposed' && (
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(deal._id, 'rejected')}>Decline</Button>
                                        <Button size="sm" onClick={() => handleStatusUpdate(deal._id, 'accepted')}>Accept</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};