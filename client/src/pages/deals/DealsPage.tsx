import React, { useMemo, useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import Modal from 'react-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addPayment, createDeal, Deal, fetchDeals, NewDealData, NewPaymentData } from '../../api/deals';
import toast from 'react-hot-toast';
import { format } from 'date-fns/format';
import { CollaborationRequest, fetchSentRequests } from '../../api/collaborations';

Modal.setAppElement('#root');

const modalStyles = {
  overlay: { zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '500px' },
};

const dealsMock = [
  {
    id: 1,
    startup: {
      name: 'TechWave AI',
      logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      industry: 'FinTech'
    },
    amount: '$1.5M',
    equity: '15%',
    status: 'Due Diligence',
    stage: 'Series A',
    lastActivity: '2024-02-15'
  },
  {
    id: 2,
    startup: {
      name: 'GreenLife Solutions',
      logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      industry: 'CleanTech'
    },
    amount: '$2M',
    equity: '20%',
    status: 'Term Sheet',
    stage: 'Seed',
    lastActivity: '2024-02-10'
  },
  {
    id: 3,
    startup: {
      name: 'HealthPulse',
      logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      industry: 'HealthTech'
    },
    amount: '$800K',
    equity: '12%',
    status: 'Negotiation',
    stage: 'Pre-seed',
    lastActivity: '2024-02-05'
  }
];

export const DealsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Modal States
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isPaymentMode, setIsPaymentMode] = useState(false);

  // Form States
  const [newDeal, setNewDeal] = useState<Omit<NewDealData, 'investorId'>>({ entrepreneurId: '', startupName: '', amount: '', equity: '', status: 'Negotiation', stage: 'Seed' });
  const [newPayment, setNewPayment] = useState({ amount: 0, notes: '' });

  // --- DATA FETCHING & MUTATIONS ---
  const { data: deals = [], isLoading } = useQuery<Deal[]>({ queryKey: ['deals'], queryFn: fetchDeals });

  // Fetch sent requests to determine connections ---
  const { data: sentRequests = [] } = useQuery<CollaborationRequest[]>({
    queryKey: ['sentRequests'],
    queryFn: fetchSentRequests,
    enabled: isAddDealModalOpen, // Only fetch when the modal is opened
  });

  // Derive the list of connections from the fetched data ---
  const connections = useMemo(() =>
    sentRequests
      .filter(req => req.status === 'accepted')
      .map(req => req.entrepreneurId) // Assuming entrepreneurId is populated
      .filter(Boolean as any) // Filter out any potential null/undefined values
    , [sentRequests]);

  const createDealMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      toast.success("Deal added successfully!");
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setIsAddDealModalOpen(false);
      setNewDeal({ entrepreneurId: '', startupName: '', amount: '', equity: '', status: 'Negotiation', stage: 'Seed' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add deal."),
  });

  const addPaymentMutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      toast.success("Payment added successfully!");
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setIsPaymentMode(false);
      setNewPayment({ amount: 0, notes: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add payment."),
  });

  const handleAddDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDealMutation.mutate(newDeal);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    const paymentData: NewPaymentData = { dealId: selectedDeal._id, ...newPayment };
    addPaymentMutation.mutate(paymentData);
  };

  const closeViewModal = () => {
    setSelectedDeal(null);
    setIsPaymentMode(false); // Reset to view mode
    setNewPayment({ amount: 0, notes: '' }); // Reset payment form
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = searchQuery === '' ||
        deal.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.entrepreneurId?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(deal.status);
      return matchesSearch && matchesStatus;
    });
  }, [deals, searchQuery, selectedStatus]);

  const { totalInvestment, activeDealsCount, portfolioCount } = useMemo(() => {
    const total = deals.reduce((sum, deal) => {
      if (deal.status === 'Closed') {
        const value = parseFloat(deal.amount.replace(/[^0-9.]/g, ''));
        const multiplier = deal.amount.toUpperCase().includes('M') ? 1000000 : deal.amount.toUpperCase().includes('K') ? 1000 : 1;
        return sum + (value * multiplier);
      }
      return sum;
    }, 0);
    const active = deals.filter(d => d.status !== 'Closed' && d.status !== 'Passed').length;
    const portfolio = deals.filter(d => d.status === 'Closed').length;
    return { totalInvestment: total, activeDealsCount: active, portfolioCount: portfolio };
  }, [deals]);

  const statuses = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>

        <Button onClick={() => setIsAddDealModalOpen(true)} leftIcon={<PlusCircle size={18} />} className='w-fit'>
          Add Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">${(totalInvestment / 1000000).toFixed(1)}M</p>
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
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Portfolio Companies</p>
                <p className="text-lg font-semibold text-gray-900">{portfolioCount}</p>
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
                <p className="text-lg font-semibold text-gray-900">0</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
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

      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Active Deals</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && <tr><td colSpan={7} className="text-center p-4">Loading deals...</td></tr>}
                {filteredDeals.map(deal => (
                  <tr key={deal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={deal.entrepreneurId?.avatarUrl}
                          alt={deal.startupName}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {deal.startupName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deal.entrepreneurId.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.equity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(deal.status)}>
                        {deal.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.stage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(deal.updatedAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button onClick={() => setSelectedDeal(deal)} variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* --- MODALS --- */}

      {/* Add Deal Modal */}
      <Modal isOpen={isAddDealModalOpen} onRequestClose={() => setIsAddDealModalOpen(false)} style={modalStyles}>
        <h2 className="text-xl font-bold mb-4">Add New Deal</h2>
        <form onSubmit={handleAddDealSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Entrepreneur</label>
            <select
              value={newDeal.entrepreneurId}
              onChange={e => {
                const selectedId = e.target.value;
                // Find the selected entrepreneur to auto-fill their startup name
                const selectedEntrepreneur = connections.find(c => c._id === selectedId);
                const startupName = selectedEntrepreneur?.entrepreneurProfile?.startupName || selectedEntrepreneur?.name || '';

                setNewDeal({
                  ...newDeal,
                  entrepreneurId: selectedId,
                  startupName: startupName // Auto-fill the startup name
                });
              }}
              required
              className="w-full border-gray-300 rounded-md p-2"
            >
              <option value="" disabled>-- Choose a Connection --</option>
              {connections.map(entrepreneur => (
                <option key={entrepreneur._id} value={entrepreneur._id}>
                  {entrepreneur.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Startup Name" value={newDeal.startupName} onChange={e => setNewDeal({ ...newDeal, startupName: e.target.value })} required />
          <Input label="Investment Amount" value={newDeal.amount} onChange={e => setNewDeal({ ...newDeal, amount: e.target.value })} placeholder="$1.5M" required />
          <Input label="Equity Percentage" value={newDeal.equity} onChange={e => setNewDeal({ ...newDeal, equity: e.target.value })} placeholder="15%" required />
          <Input label="Stage" value={newDeal.stage} onChange={e => setNewDeal({ ...newDeal, stage: e.target.value })} placeholder="Series A" required />
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={newDeal.status} onChange={e => setNewDeal({ ...newDeal, status: e.target.value as Deal['status'] })} className="w-full border-gray-300 rounded-md">
              <option>Due Diligence</option>
              <option>Term Sheet</option>
              <option>Negotiation</option>
              <option>Closed</option>
              <option>Passed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddDealModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createDealMutation.isPending}>Save Deal</Button>
          </div>
        </form>
      </Modal>

      {/* View/Payment Modal */}
      <Modal isOpen={!!selectedDeal} onRequestClose={closeViewModal} style={modalStyles}>
        {selectedDeal && ( // Ensure selectedDeal is not null before rendering
          <>
            {!isPaymentMode ? (
              // --- VIEW DETAILS MODE ---
              <div className="space-y-4">
                <div className="pb-2 border-b">
                  <h2 className="text-xl font-bold">{selectedDeal.startupName}</h2>
                  <p className="text-sm text-gray-500">Deal with {selectedDeal.entrepreneurId?.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong className="block text-gray-500">Amount:</strong> {selectedDeal.amount}</div>
                  <div><strong className="block text-gray-500">Equity:</strong> {selectedDeal.equity}</div>
                  <div><strong className="block text-gray-500">Stage:</strong> {selectedDeal.stage}</div>
                  <div><strong className="block text-gray-500">Status:</strong> <Badge variant={getStatusColor(selectedDeal.status)}>{selectedDeal.status}</Badge></div>
                </div>
                {/* We would add a list of payments/transactions here in the future */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={closeViewModal}>Close</Button>
                  {selectedDeal.status === 'Closed' && (
                    <Button onClick={() => setIsPaymentMode(true)}>Add Payment</Button>
                  )}
                </div>
              </div>
            ) : (
              // --- ADD PAYMENT MODE ---
              <div>
                <h2 className="text-xl font-bold mb-4">Add Payment for {selectedDeal.startupName}</h2>
                <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                  <Input label="Amount (USD)" type="number" value={newPayment.amount || ''} onChange={e => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })} required />
                  <textarea value={newPayment.notes} onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder="Notes (optional)..." className="w-full border-gray-300 rounded-md p-2" rows={3}></textarea>
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsPaymentMode(false)}>Back to Details</Button>
                    <Button type="submit" isLoading={addPaymentMutation.isPending}>Confirm Payment</Button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};