// src/pages/EntrepreneursPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MapPin } from 'lucide-react';

import { fetchEntrepreneurs } from '../../api/user';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { User } from '../../types';

// Skeleton loader to show while fetching data
const EntrepreneurCardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg shadow border animate-pulse">
    <div className="flex items-start mb-4"><div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div></div>
    <div className="space-y-2"><div className="h-3 bg-gray-200 rounded"></div><div className="h-3 bg-gray-200 rounded w-5/6"></div></div>
  </div>
);

export const EntrepreneursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>([]);

  const { data: entrepreneurs = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['entrepreneurs'],
    queryFn: fetchEntrepreneurs,
  });

  const allIndustries = useMemo(() => Array.from(new Set(entrepreneurs.map(e => e.entrepreneurProfile?.industry).filter(Boolean))), [entrepreneurs]);
  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];

  const filteredEntrepreneurs = useMemo(() => {
    if (!entrepreneurs) return [];
    return entrepreneurs.filter(entrepreneur => {
      const profile = entrepreneur.entrepreneurProfile;
      if (!profile) return false;

      const matchesSearch = searchQuery === '' ||
        entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.startupName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (profile.industry?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (profile.pitchSummary?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesIndustry = selectedIndustries.length === 0 || (profile.industry && selectedIndustries.includes(profile.industry));

      const matchesFunding = selectedFundingRange.length === 0 || selectedFundingRange.some(range => {
        if (!profile.fundingNeeded) return false;
        const value = parseFloat(profile.fundingNeeded.replace(/[^0-9.]/g, ''));
        const multiplier = profile.fundingNeeded.toUpperCase().includes('M') ? 1000000 : profile.fundingNeeded.toUpperCase().includes('K') ? 1000 : 1;
        const amount = value * multiplier;
        switch (range) {
          case '< $500K': return amount < 500000;
          case '$500K - $1M': return amount >= 500000 && amount <= 1000000;
          case '$1M - $5M': return amount > 1000000 && amount <= 5000000;
          case '> $5M': return amount > 5000000;
          default: return true;
        }
      });

      return matchesSearch && matchesIndustry && matchesFunding;
    });
  }, [entrepreneurs, searchQuery, selectedIndustries, selectedFundingRange]);

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]);
  };

  const toggleFundingRange = (range: string) => {
    setSelectedFundingRange(prev => prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-lg font-medium text-gray-900">Filters</h2></CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                <div className="space-y-2">
                  {allIndustries.map(industry => (
                    <button key={industry} onClick={() => toggleIndustry(industry)} className={`...`}>{industry}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Funding Range</h3>
                <div className="space-y-2">
                  {fundingRanges.map(range => (
                    <button key={range} onClick={() => toggleFundingRange(range)} className={`...`}>{range}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="space-y-2">
                  {/* ... Static location buttons ... */}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} startAdornment={<Search size={18} />} fullWidth />
            <div className="flex items-center gap-2 flex-shrink-0"><Filter size={18} className="text-gray-500" /><span className="text-sm text-gray-600">{filteredEntrepreneurs.length} results</span></div>
          </div>

          {isError && <div className="text-red-600 p-4 bg-red-50 rounded-md">Failed to load entrepreneurs. Please try again later.</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <EntrepreneurCardSkeleton />
                <EntrepreneurCardSkeleton />
                <EntrepreneurCardSkeleton />
                <EntrepreneurCardSkeleton />
              </>
            ) : (
              filteredEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard key={entrepreneur._id} entrepreneur={entrepreneur} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};