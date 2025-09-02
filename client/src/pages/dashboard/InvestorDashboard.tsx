import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, PieChart, Search, PlusCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { fetchEntrepreneurs } from '../../api/users';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { User } from '../../types';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Fetch all entrepreneurs to display on the dashboard
  const { data: entrepreneurs = [], isLoading } = useQuery<User[]>({
    queryKey: ['entrepreneurs'],
    queryFn: fetchEntrepreneurs,
  });

  if (!user) return null;

  const industries = useMemo(() => Array.from(new Set(entrepreneurs.map(e => e.entrepreneurProfile?.industry).filter(Boolean as any))), [entrepreneurs]);

  function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
  }
  const industries_alternative = useMemo(() =>
    Array.from(new Set(
      entrepreneurs
        .map(e => e.entrepreneurProfile?.industry)
        .filter(isDefined) // Now TypeScript knows this array only contains strings
    ))
    , [entrepreneurs]);

  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter(entrepreneur => {
      const profile = entrepreneur.entrepreneurProfile;
      if (!profile) return false;

      // Search filter
      const matchesSearch = searchQuery === '' ||
        entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.startupName && profile.startupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (profile.industry && profile.industry.toLowerCase().includes(searchQuery.toLowerCase()));

      // Industry filter
      const matchesIndustry = selectedIndustries.length === 0 ||
        (profile.industry && selectedIndustries.includes(profile.industry));

      return matchesSearch && matchesIndustry;
    });
  }, [entrepreneurs, searchQuery, selectedIndustries]);

  // Toggle industry selection handler
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prevSelected =>
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  };

  // Connection stats would require fetching sent collaboration requests (future step)
  const acceptedConnections = 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>

        <Link to="/entrepreneurs" className='w-fit'>
          <Button
            leftIcon={<PlusCircle size={18} />}
          >
            View All Startups
          </Button>
        </Link>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups by name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        <div className="w-full md:w-1/3 text-right">
          <span className="text-sm text-gray-600">{filteredEntrepreneurs.length} results found</span>
        </div>
      </div>

      {/* Industry filter buttons */}
      <div className="flex flex-wrap gap-2">
        <h3 className="text-sm font-medium mr-2 self-center">Filter by Industry:</h3>
        {industries_alternative.slice(0, 5).map(industry => ( // Show first 5 for brevity
          <Badge
            key={industry}
            variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
            className="cursor-pointer"
            onClick={() => toggleIndustry(industry)}
          >
            {industry}
          </Badge>
        ))}
        {selectedIndustries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedIndustries([])}>Clear</Button>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">{acceptedConnections}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Entrepreneurs grid */}
      <div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          </CardHeader>

          <CardBody>
            {isLoading && <p>Loading startups...</p>}
            {!isLoading && filteredEntrepreneurs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEntrepreneurs.map(entrepreneur => (
                  <EntrepreneurCard key={entrepreneur._id} entrepreneur={entrepreneur} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No startups match your filters</p>
                  <Button variant="outline" className="mt-2" onClick={() => { setSearchQuery(''); setSelectedIndustries([]); }}>
                    Clear filters
                  </Button>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};