// src/pages/InvestorsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, MapPin } from 'lucide-react';

import { fetchInvestors } from '../../api/users';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { User } from '../../types';

// A skeleton loader that matches the card's layout
const InvestorCardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg shadow border animate-pulse">
    <div className="flex items-start mb-4"><div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div></div>
    <div className="space-y-2"><div className="h-3 bg-gray-200 rounded"></div><div className="h-3 bg-gray-200 rounded w-5/6"></div></div>
  </div>
);


export const InvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Fetch live data from the API
  const { data: investors = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['investors'],
    queryFn: fetchInvestors,
  });

  // Derive filter options from live data
  const allLocations = useMemo(() => Array.from(new Set(investors.map(e => e.location).filter(Boolean as any))), [investors]);
  const allStages = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investorProfile?.investmentStage || []))), [investors]);
  const allInterests = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investorProfile?.investmentInterests || []))), [investors]);

  // Filter live data based on user selections
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const profile = investor.investorProfile;
      if (!profile) return false;

      const matchesSearch = searchQuery === '' ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.investmentInterests?.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStages = selectedStages.length === 0 || profile.investmentStage?.some(stage => selectedStages.includes(stage));
      const matchesInterests = selectedInterests.length === 0 || profile.investmentInterests?.some(interest => selectedInterests.includes(interest));
      const matchesLocation = selectedLocations.length === 0 || (investor.location && selectedLocations.includes(investor.location));

      return matchesSearch && matchesStages && matchesInterests && matchesLocation;
    });
  }, [investors, searchQuery, selectedStages, selectedInterests, selectedLocations]);

  const toggleStage = (stage: string) => {
    setSelectedStages(prev => prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                <div className="flex flex-wrap gap-2">
                  {allStages.map(stage => (
                    <Badge
                      key={stage}
                      variant={selectedStages.includes(stage) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleStage(stage)}
                    >
                      {stage}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {allInterests.map(interest => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="flex flex-wrap gap-2">
                  {allLocations.map(location => (
                    <Badge
                      key={location}
                      variant={selectedLocations.includes(location) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleLocation(location)}
                    >
                      <MapPin size={12} className="mr-1" />
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">{filteredInvestors.length} results</span>
            </div>
          </div>

          {isError && <div className="p-4 bg-red-50 text-red-700 rounded-md">Failed to load investors. Please try again later.</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <InvestorCardSkeleton />
                <InvestorCardSkeleton />
                <InvestorCardSkeleton />
                <InvestorCardSkeleton />
              </>
            ) : (
              filteredInvestors.map(investor => (
                <InvestorCard key={investor._id} investor={investor} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};