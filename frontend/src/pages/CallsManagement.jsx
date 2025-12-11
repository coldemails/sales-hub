import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { closersApi, calendlyApi } from '../services/api';
import { 
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowLeft,
  Info,
  User,
  ChevronDown,
  ChevronUp,
  Zap,
  Target
} from 'lucide-react';

export default function CallsManagement() {
  const [activeTab, setActiveTab] = useState('closers');
  const [selectedDateFilter, setSelectedDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showAllClosers, setShowAllClosers] = useState(false);

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    let start, end;

    switch (selectedDateFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);
        break;
      
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        end = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59);
        break;
      
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
          end.setHours(23, 59, 59);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
        break;
      
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Fetch closers data
  const { data: closersData, isLoading: closersLoading } = useQuery({
    queryKey: ['closers'],
    queryFn: async () => {
      const response = await closersApi.getClosers();
      return response.data;
    },
    refetchInterval: 30000
  });

  // Fetch event types with team classification
  const { data: eventTypesData, isLoading: eventTypesLoading } = useQuery({
    queryKey: ['calendly-event-types-team'],
    queryFn: async () => {
      const response = await calendlyApi.getEventTypesWithTeamInfo();
      return response.data;
    },
    refetchInterval: 300000, // 5 minutes - event types don't change often
    staleTime: 240000 // 4 minutes
  });

  // Fetch Calendly events
  const { data: calendlyEventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['calendly-events', selectedDateFilter, customStartDate, customEndDate],
    queryFn: async () => {
      const response = await calendlyApi.getScheduledEvents({
        min_start_time: startDate.toISOString(),
        max_start_time: endDate.toISOString(),
        status: 'active',
        count: 100
      });
      return response.data;
    },
    refetchInterval: 60000,
    enabled: !!startDate && !!endDate
  });

  const closers = closersData?.closers || [];
  const allEvents = calendlyEventsData?.events || [];
  const eventTypesInfo = eventTypesData?.eventTypes || [];

  // Create event type lookup map for URLs and team classification
  const eventTypeMap = eventTypesInfo.reduce((acc, et) => {
    acc[et.uri] = {
      name: et.name,
      scheduling_url: et.scheduling_url,
      isTeamEvent: et.isTeamEvent,
      pooling_type: et.pooling_type
    };
    return acc;
  }, {});

  // Calculate stats
  const closersWithNumbers = closers.filter(c => c.assignedPhoneNumber);
  const totalCallsToday = allEvents.length;
  
  const slotsPerCloser = 16;
  const totalPossibleSlots = closersWithNumbers.length * slotsPerCloser;
  const availableSlots = Math.max(0, totalPossibleSlots - totalCallsToday);
  const utilizationPercent = totalPossibleSlots > 0 
    ? Math.round((totalCallsToday / totalPossibleSlots) * 100) 
    : 0;

  // Per-closer breakdown
  const closerCallsBreakdown = closers.map(closer => {
    const closerCalls = allEvents.filter(event => {
      const inviteeEmail = event.invitee_email || '';
      const eventName = event.event_memberships?.[0]?.user_name || '';
      const eventEmail = event.event_memberships?.[0]?.user_email || '';
      
      return inviteeEmail === closer.email || 
             eventEmail === closer.email || 
             eventName.includes(closer.firstName);
    });

    return {
      ...closer,
      callsToday: closerCalls.length,
      availableSlots: Math.max(0, slotsPerCloser - closerCalls.length),
      utilizationPercent: Math.round((closerCalls.length / slotsPerCloser) * 100)
    };
  }).filter(c => c.assignedPhoneNumber);

  const sortedClosers = [...closerCallsBreakdown].sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  const displayClosers = showAllClosers ? sortedClosers : sortedClosers.slice(0, 8);
  const hiddenCount = sortedClosers.length - 8;

  // Helper to get clean booking URL from scheduling_url
  const getCleanSchedulingUrl = (scheduling_url) => {
    if (!scheduling_url) return null;
    try {
      const url = new URL(scheduling_url);
      return url.hostname + url.pathname; // Returns like "calendly.com/team/event-name"
    } catch {
      return scheduling_url; // Return as-is if URL parsing fails
    }
  };

  // Helper to detect if event is personal based on name pattern
  const isPersonalEvent = (eventName) => {
    if (!eventName) return false;
    
    // Pattern: Contains (Name) or (First Last) with at least 3+ characters
    // Examples: "(Ben)", "(Daniel Palacio)", "(Jordan G)", "(Alex)", "(Tristan)"
    // NOT: "(N)" which is too short to be a name
    const nameInParenthesesPattern = /\([A-Z][a-z]{2,}[^)]*\)/;
    
    return nameInParenthesesPattern.test(eventName);
  };

  // Event Type Breakdown - FILTER BY ACTUAL TEAM EVENTS FROM API
  const eventTypeBreakdown = allEvents.reduce((acc, event) => {
    const eventTypeUri = event.event_type || 'unknown';
    const eventTypeName = event.name || 'Unknown Event';
    const memberCount = event.event_memberships?.length || 0;
    
    // FILTER 1: Exclude personal events by name pattern
    // Personal events have names like: "Onboarding Call (Ben)", "Onboarding Call (Daniel Palacio)"
    // Keep team events like: "Profit Strategy Call (N)" where (N) is too short to be a personal name
    if (isPersonalEvent(eventTypeName)) {
      return acc;
    }
    
    // Check if this event type is a team event from our API data
    const eventTypeInfo = eventTypeMap[eventTypeUri];
    const isTeamEvent = eventTypeInfo?.isTeamEvent || memberCount >= 2; // Fallback to member count
    
    // FILTER 2: Only include team events
    if (!isTeamEvent) {
      return acc;
    }
    
    if (!acc[eventTypeUri]) {
      acc[eventTypeUri] = {
        name: eventTypeName,
        eventTypeUri: eventTypeUri,
        scheduling_url: eventTypeInfo?.scheduling_url || null,
        pooling_type: eventTypeInfo?.pooling_type || null,
        count: 0,
        closers: new Set(),
        memberCount: memberCount
      };
    }
    
    acc[eventTypeUri].count++;
    
    event.event_memberships?.forEach(member => {
      if (member.user_name) {
        acc[eventTypeUri].closers.add(member.user_name);
      }
    });
    
    return acc;
  }, {});

  const eventTypeStats = Object.values(eventTypeBreakdown)
    .map(et => ({
      ...et,
      closers: Array.from(et.closers),
      percentage: totalCallsToday > 0 ? Math.round((et.count / totalCallsToday) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const activeEventTypes = eventTypeStats.length;
  const totalTeamCalls = eventTypeStats.reduce((sum, et) => sum + et.count, 0);

  const isLoading = closersLoading || eventsLoading || eventTypesLoading;

  const dateFilters = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'custom', label: 'Custom' }
  ];

  const handleDateFilterChange = (filterId) => {
    setSelectedDateFilter(filterId);
    if (filterId === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleApplyCustomDates = () => {
    if (customStartDate && customEndDate) {
      setShowCustomPicker(false);
    }
  };

  const getDisplayDateRange = () => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    
    if (selectedDateFilter === 'today') {
      return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (selectedDateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (selectedDateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (selectedDateFilter === 'thisWeek') {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    } else if (selectedDateFilter === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString('en-US', options)} - ${new Date(customEndDate).toLocaleDateString('en-US', options)}`;
    }
    return '';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Calls Analytics</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Monitor scheduled calls and performance metrics</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('closers')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'closers'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Closer Performance</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'events'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Event Performance</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleDateFilterChange(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedDateFilter === filter.id
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {showCustomPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleApplyCustomDates}
                  disabled={!customStartDate || !customEndDate}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}

          {!showCustomPicker && (
            <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{getDisplayDateRange()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'closers' ? (
          <motion.div
            key="closers"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Stats Overview */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? '-' : totalCallsToday}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Calls Booked</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? '-' : availableSlots}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Available Slots</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? '-' : utilizationPercent}%
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Team Utilization</p>
                  {!isLoading && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${utilizationPercent}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${
                            utilizationPercent >= 80
                              ? 'bg-green-500'
                              : utilizationPercent >= 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message for Setters */}
            {!isLoading && (
              <div>
                {availableSlots > 0 && closerCallsBreakdown.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">
                          Message for Setters
                        </p>
                        <p className="text-sm text-blue-800">
                          We have <strong>{availableSlots} available slots</strong> for the selected period. Keep booking those calls!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {availableSlots === 0 && closerCallsBreakdown.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Fully Booked! 🎉
                        </p>
                        <p className="text-sm text-green-800">
                          All closers are at capacity for the selected period. Great job team!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Per-Closer Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Per-Closer Breakdown</h2>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading calls data...</p>
                </div>
              ) : closerCallsBreakdown.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-semibold mb-2">No Active Closers</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Assign 650 numbers to closers to start tracking their calls
                  </p>
                  <Link
                    to="/closers"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <span>Go to Closers</span>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayClosers.map((closer, index) => (
                      <motion.div
                        key={closer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {closer.firstName?.charAt(0) || 'C'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {closer.firstName} {closer.lastName}
                              </p>
                              <p className="text-xs text-gray-600 truncate">{closer.assignedPhoneNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">{closer.callsToday}</p>
                              <p className="text-xs text-gray-500">calls</p>
                            </div>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">{closer.availableSlots}</p>
                              <p className="text-xs text-gray-500">slots</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Capacity</span>
                            <span className="font-bold text-gray-900">{closer.utilizationPercent}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${closer.utilizationPercent}%` }}
                              transition={{ duration: 0.5, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full rounded-full ${
                                closer.utilizationPercent >= 80
                                  ? 'bg-green-500'
                                  : closer.utilizationPercent >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {closer.callsToday}/{slotsPerCloser} filled
                            </span>
                            {closer.availableSlots > 0 && (
                              <span className="text-blue-600 font-semibold">
                                +{closer.availableSlots} more
                              </span>
                            )}
                            {closer.availableSlots === 0 && (
                              <span className="text-green-600 font-semibold">✓ Full</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllClosers(!showAllClosers)}
                      className="w-full mt-4 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {showAllClosers ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Show {hiddenCount} More Closer{hiddenCount > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="events"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Event Stats Overview */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? '-' : totalTeamCalls}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Team Event Calls</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {isLoading ? '-' : activeEventTypes}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Active Team Events</p>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Team Events Only
                  </p>
                  <p className="text-sm text-blue-800">
                    Showing only team events (Round Robin/Collective). Personal closer events like "Onboarding Call (Ben)" are automatically excluded.
                  </p>
                </div>
              </div>
            </div>

            {/* Event Type Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Event Type Performance</h2>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Loading event data...</p>
                </div>
              ) : eventTypeStats.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-semibold mb-2">No Team Events Found</p>
                  <p className="text-sm text-gray-600">
                    No team events (2+ closers) scheduled for the selected period
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventTypeStats.map((eventType, index) => (
                    <motion.div
                      key={eventType.eventTypeUri}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-gray-900 text-base mb-1">
                                {eventType.name}
                              </h3>
                              {eventType.scheduling_url ? (
                                <a
                                  href={eventType.scheduling_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 font-mono break-all hover:underline"
                                >
                                  {getCleanSchedulingUrl(eventType.scheduling_url)}
                                </a>
                              ) : (
                                <p className="text-xs text-gray-400 font-mono">
                                  URL not available
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Closers */}
                          <div className="flex flex-wrap gap-1.5 ml-13">
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              {eventType.closers.length} closer{eventType.closers.length !== 1 ? 's' : ''}
                            </span>
                            {eventType.closers.slice(0, 4).map((closer, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                              >
                                {closer}
                              </span>
                            ))}
                            {eventType.closers.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                +{eventType.closers.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-3xl font-bold text-gray-900">{eventType.count}</p>
                          <p className="text-xs text-gray-600">calls</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Share of Team Calls</span>
                          <span className="font-bold text-gray-900">{eventType.percentage}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${eventType.percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${
                              eventType.percentage >= 40
                                ? 'bg-green-500'
                                : eventType.percentage >= 20
                                ? 'bg-blue-500'
                                : eventType.percentage >= 10
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Insights */}
            {!isLoading && eventTypeStats.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performer */}
                {eventTypeStats[0] && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          🔥 Top Performing Event
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>{eventTypeStats[0].name}</strong> is leading with {eventTypeStats[0].count} calls ({eventTypeStats[0].percentage}% of team calls)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Needs Attention */}
                {eventTypeStats[eventTypeStats.length - 1]?.percentage < 10 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          ⚠️ Needs Attention
                        </p>
                        <p className="text-sm text-amber-800">
                          <strong>{eventTypeStats[eventTypeStats.length - 1].name}</strong> only has {eventTypeStats[eventTypeStats.length - 1].count} calls ({eventTypeStats[eventTypeStats.length - 1].percentage}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}