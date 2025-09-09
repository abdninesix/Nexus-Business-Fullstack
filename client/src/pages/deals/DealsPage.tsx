import React, { useMemo, useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import Modal from 'react-modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addPayment, createDeal, Deal, fetchDeals, fetchSentTransactions, NewDealData, NewPaymentData, Transaction, updateDeal } from '../../api/deals';
import toast from 'react-hot-toast';
import { CollaborationRequest, fetchSentRequests } from '../../api/collaborations';
import { format } from 'date-fns/format';
import { TransactionList } from '../../components/deals/TransactionList';

Modal.setAppElement('#root');

const modalStyles = {
  overlay: { zIndex: 50, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '500px' },
};

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
  const [editingDeal, setEditingDeal] = useState<Partial<Deal> | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: 0, notes: '' });

  // --- DATA FETCHING & MUTATIONS ---
  const { data: deals = [], isLoading } = useQuery<Deal[]>({ queryKey: ['deals'], queryFn: fetchDeals });

  // Fetch sent requests to determine connections ---
  const { data: sentRequests = [] } = useQuery<CollaborationRequest[]>({
    queryKey: ['sentRequests'],
    queryFn: fetchSentRequests,
    enabled: isAddDealModalOpen, // Only fetch when the modal is opened
  });

  const { data: sentTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['sentTransactions'],
    queryFn: fetchSentTransactions,
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

  const updateDealMutation = useMutation({
    mutationFn: updateDeal,
    onSuccess: (updatedDeal) => {
      toast.success(`Deal status updated to "${updatedDeal.status}"`);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      // If the modal was in edit mode, exit it
      setEditingDeal(null);
      // Also update the selectedDeal to show the latest data
      setSelectedDeal(updatedDeal);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update deal."),
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

  const handleNewDealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'equity') {
      const numValue = Number(value);
      // Only update if it's a valid number within the range
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setNewDeal(prev => ({ ...prev, equity: value }));
      } else if (value === '') { // Allow clearing the input
        setNewDeal(prev => ({ ...prev, equity: '' }));
      }
    } else {
      setNewDeal(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Format the data before sending to the backend
    const dataToSend = {
      ...newDeal,
      amount: `$${newDeal.amount}`, // Add the '$' sign
      equity: `${newDeal.equity}%`, // Add the '%' sign
    };
    createDealMutation.mutate(dataToSend);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;
    const paymentData: NewPaymentData = { dealId: selectedDeal._id, ...newPayment };
    addPaymentMutation.mutate(paymentData);
  };

  const handleUpdateDealStatus = (status: Deal['status']) => {
    if (!selectedDeal) return;
    updateDealMutation.mutate({ id: selectedDeal._id, data: { status } });
  };

  const handleEditDealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'equity') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        // Store the raw string value in the state
        setEditingDeal(prev => ({ ...prev, equity: value }));
      } else if (value === '') {
        setEditingDeal(prev => ({ ...prev, equity: '' }));
      }
    } else {
      setEditingDeal(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !selectedDeal) return;
    const dataToSend = {
      ...editingDeal,
      amount: `$${editingDeal.amount}`,
      equity: `${editingDeal.equity}%`,
    };
    updateDealMutation.mutate({ id: selectedDeal._id, data: dataToSend });
  };

  const handleUpdateStatus = (status: Deal['status']) => {
    if (!selectedDeal) return;
    // Optional confirmation for destructive actions
    if (status === 'Passed' && !window.confirm("Are you sure you want to pass on this deal? This action cannot be undone.")) {
      return;
    }
    updateDealMutation.mutate({ id: selectedDeal._id, data: { status } });
  };

  const closeViewModal = () => {
    setSelectedDeal(null);
    setIsPaymentMode(false); // Reset to view mode
    setNewPayment({ amount: 0, notes: '' }); // Reset payment form
    setEditingDeal(null); // Reset the editing state when the modal closes
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

  const { totalInvestment, activeDealsCount, closedDealsCount, portfolioCount } = useMemo(() => {
    const dealsMap = new Map(deals.map(deal => [deal._id, deal]));
    const totalValue = sentTransactions.reduce((sum, transaction) => {
      // Find the parent deal for this transaction
      const parentDeal = dealsMap.get(transaction.dealId._id);
      if (parentDeal && parentDeal.status === 'Closed') {
        const investmentAmount = transaction.amount;
        const equityValue = parseFloat(parentDeal.equity.replace('%', ''));
        if (!isNaN(equityValue) && equityValue > 0) {
          return sum + ((equityValue / 100) * investmentAmount);
        }
      }
      return sum;
    }, 0);
    const active = deals.filter(d => d.status !== 'Closed' && d.status !== 'Passed').length;
    const closedDeals = deals.filter(d => d.status === 'Closed');
    const closed = closedDeals.length;
    const uniqueEntrepreneurIds = new Set(
      closedDeals.map(deal => deal.entrepreneurId?._id).filter(Boolean)
    );
    const portfolio = uniqueEntrepreneurIds.size;
    return { totalInvestment: totalValue, activeDealsCount: active, closedDealsCount: closed, portfolioCount: portfolio };
  }, [deals, sentTransactions]);

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
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalInvestment)}</p>
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
                  <tr key={deal._id} className={`transition-colors duration-200 ${deal.status === 'Proposed' ? 'bg-primary-100 hover:bg-primary-200' : 'hover:bg-gray-50'}`}>
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
              <option value="" disabled>Choose a Connection</option>
              {connections.map(entrepreneur => (
                <option key={entrepreneur._id} value={entrepreneur._id}>
                  {entrepreneur.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Startup Name" value={newDeal.startupName} onChange={e => setNewDeal({ ...newDeal, startupName: e.target.value })} required />
          <Input label="Investment Amount" name="amount" value={newDeal.amount} startAdornment="$" onChange={handleNewDealChange} placeholder="1.5M, 200K etc" required />
          <Input label="Equity Percentage" name="equity" type="number" value={newDeal.equity || ''} endAdornment="%" placeholder="0-100" onChange={handleNewDealChange} min={0} max={100} required />
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

      {/* View/Edit/Payment Modal */}
      <Modal isOpen={!!selectedDeal} onRequestClose={closeViewModal} style={modalStyles}>
        {selectedDeal && (
          <>
            {/* EDIT MODE */}
            {editingDeal ? (
              <form onSubmit={handleEditDealSubmit} className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Edit Deal Proposal</h2>
                <Input label="Startup Name" value={editingDeal.startupName || ''} onChange={e => setEditingDeal({ ...editingDeal, startupName: e.target.value })} />
                <Input label="Amount" name="amount" value={String(editingDeal.amount || '').replace(/[^0-9.KkMm]/g, '')} startAdornment="$" placeholder="500K, 1.5M etc" onChange={handleEditDealChange} />
                <Input label="Equity" name="equity" type="number" value={String(editingDeal.equity || '').replace('%', '')} endAdornment="%" placeholder="15, 20 etc" min={0} max={100} onChange={handleEditDealChange} />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingDeal(null)}>Cancel</Button>
                  <Button type="submit" isLoading={updateDealMutation.isPending}>Save Changes</Button>
                </div>
              </form>
            ) :
              // PAYMENT MODE
              isPaymentMode ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Add Payment for {selectedDeal.startupName}</h2>
                  <form onSubmit={handleAddPaymentSubmit} className="space-y-4">
                    <Input label="Amount" type="number" placeholder='Enter full figure' startAdornment="$" value={newPayment.amount || ''} onChange={e => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })} required />
                    <textarea value={newPayment.notes} onChange={e => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder="Notes (optional)..." className="w-full border border-gray-300 rounded-md p-2" rows={3}></textarea>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsPaymentMode(false)}>Back to Details</Button>
                      <Button type="submit" isLoading={addPaymentMutation.isPending}>Confirm Payment</Button>
                    </div>
                  </form>
                </div>
              ) : (
                // VIEW DETAILS MODE
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

                  {['Negotiation', 'Term Sheet', 'Due Diligence', 'Closed'].includes(selectedDeal.status) && (
                    <div className="pt-4 border-t">
                      <TransactionList dealId={selectedDeal._id} />
                    </div>
                  )}

                  {/* --- DYNAMIC ACTION BUTTONS --- */}
                  <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={closeViewModal}>Close</Button>

                    {/* Edit/Withdraw for 'Proposed' status */}
                    {selectedDeal.status === 'Proposed' && (
                      <>
                        <Button variant="secondary" onClick={() => setEditingDeal(selectedDeal)}>Edit</Button>
                        <Button variant="error" onClick={() => handleUpdateStatus('Passed')}>Withdraw</Button>
                      </>
                    )}

                    {/* Actions for 'Negotiation' or 'Term Sheet' status */}
                    {['Negotiation', 'Term Sheet', 'Due Diligence'].includes(selectedDeal.status) && (
                      <>
                        <Button variant="error" onClick={() => handleUpdateDealStatus('Passed')}>Pass on Deal</Button>
                        <Button variant="success" onClick={() => handleUpdateDealStatus('Closed')}>Mark as Closed</Button>
                        <Button onClick={() => setIsPaymentMode(true)}>Add Payment</Button>
                      </>
                    )}

                    {/* Add Payment for 'Closed' status */}
                    {selectedDeal.status === 'Closed' && (
                      <Button onClick={() => setIsPaymentMode(true)}>Add Follow-on Payment</Button>
                    )}
                  </div>
                </div>
              )}
          </>
        )}
      </Modal>
    </div>
  );
};