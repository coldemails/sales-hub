import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import LoadingBanner from '../components/Loadingbanner';
import { StatCard } from '../components/Card';
import { 
  Users,
  Trophy,
  TrendingUp,
  Phone,
  Loader2,
  RefreshCw,
  Target,
  Activity,
  Eye,
  X,
  Clock
} from 'lucide-react';

export default function SetterPerformance() {
  const [selectedDays, setSelectedDays] = useState(1);
  const [selectedSetter, setSelectedSetter] = useState(null);
  const [showCallsModal, setShowCallsModal] = useState(false);
  const [showDataUpdated, setShowDataUpdated] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDaysToFetch = () => {
    if (selectedDays === 'custom') {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 7;
      }
      return 7;
    }
    return parseInt(selectedDays);
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['setter-performance', 7] });
    queryClient.removeQueries({ queryKey: ['setter-performance', 14] });
    queryClient.removeQueries({ queryKey: ['setter-performance', 30] });
  }, []);

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['setter-performance', getDaysToFetch(), customStartDate, customEndDate],
    queryFn: async () => {
      const response = await analyticsApi.getSetterPerformance(getDaysToFetch());
      return response.data?.data || response.data;
    },
    staleTime: 3 * 60 * 1000,
  });

  const { data: setterCalls, isLoading: callsLoading } = useQuery({
    queryKey: ['setter-calls', selectedSetter?.userId, selectedDays],
    queryFn: async () => {
      if (!selectedSetter) return null;
      const response = await analyticsApi.getCalls({ limit: 5000 });
      const allCalls = response.data.calls || [];
      return allCalls.filter(call => true);
    },
    enabled: !!selectedSetter && showCallsModal,
  });

  useEffect(() => {
    if (!isFetching && dataUpdatedAt) {
      setShowDataUpdated(true);
      const timer = setTimeout(() => setShowDataUpdated(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFetching, dataUpdatedAt]);

  if (error && !data) {
    return (
      <div className="modern-card border border-red-300 p-4">
        <p className="text-red-600 font-medium">Error loading setter performance: {error.message}</p>
        <p className="text-sm text-gray-600 mt-2">Check if backend is running and GHL credentials are configured.</p>
      </div>
    );
  }

  const setters = data?.setters || [];
  const summary = data?.summary || {};
  const topPerformer = setters.length > 0 ? setters[0] : null;
  const topCloser = setters.length > 0 
    ? [...setters].sort((a, b) => b.bookings - a.bookings)[0]
    : null;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <LoadingBanner 
        isLoading={isLoading && !data}
        isFetching={isFetching}
        isError={!!error}
        lastUpdated={showDataUpdated}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Setter Performance</h2>
          <p className="mt-1 text-sm text-gray-600">Track individual setter dial activity and performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedDays}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'custom') {
                setShowCustomDate(true);
                setSelectedDays('custom');
              } else {
                setShowCustomDate(false);
                setSelectedDays(parseInt(value));
              }
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value={1}>Today</option>
            <option value={2}>Yesterday</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {showCustomDate && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Active Setters" value={summary.totalSetters || 0} icon={Users} color="brand" />
        <StatCard label="Total Calls" value={summary.totalCalls || 0} icon={Phone} color="brand" />
        <StatCard label="Avg Per Setter" value={summary.avgCallsPerSetter || 0} icon={Target} color="brand" />
      </div>

      {/* Top Performer Highlight */}
      {topPerformer && (
        <div className="modern-card border border-blue-300 p-4">
          <div className="flex items-start">
            <Trophy className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900">Top Performer</h3>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold text-blue-700">{topPerformer.userName}</span> is leading with{' '}
                <span className="font-semibold">{topPerformer.totalCalls} calls</span>{' '}
                ({topPerformer.answerRate}% answer rate)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Closer Highlight */}
      {topCloser && topCloser.bookings > 0 && (
        <div className="modern-card border border-blue-300 p-4">
          <div className="flex items-start">
            <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900">Most Bookings</h3>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold text-blue-700">{topCloser.userName}</span> has booked{' '}
                <span className="font-semibold">{topCloser.bookings} appointments</span>{' '}
                ({topCloser.conversionRate}% conversion rate)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setter Performance Table */}
      <div className="modern-card overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Setter Leaderboard</h3>
          <p className="text-xs text-gray-600 mt-0.5">Ranked by total dial count</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Setter Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Dials</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Own Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">State Numbers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Answer Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bookings</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Conversion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {setters.map((setter, index) => {
                const rank = index + 1;
                const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                const todaysCalls = setter.callsByDay?.[today] || 0;

                return (
                  <tr key={setter.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-lg">{medalEmoji || `#${rank}`}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{setter.userName}</p>
                        <p className="text-xs text-gray-500 truncate">{setter.email}</p>
                        {selectedDays > 1 && todaysCalls > 0 && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">
                            {todaysCalls} calls today
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Activity className="h-3.5 w-3.5 text-blue-500 mr-1.5" strokeWidth={2} />
                        <span className="text-sm font-bold text-gray-900">{setter.totalCalls}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
                        <span className="text-xs font-semibold text-gray-700">{setter.ownNumberCalls}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {setter.totalCalls > 0 ? Math.round((setter.ownNumberCalls / setter.totalCalls) * 100) : 0}%
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
                        <span className="text-xs font-semibold text-gray-700">{setter.stateNumberCalls}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {setter.totalCalls > 0 ? Math.round((setter.stateNumberCalls / setter.totalCalls) * 100) : 0}%
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-green-600">{setter.completedCalls}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-xs font-bold ${
                          setter.answerRate >= 50 ? 'text-green-600' :
                          setter.answerRate >= 30 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {setter.answerRate}%
                        </span>
                        {setter.answerRate >= 50 && (
                          <TrendingUp className="h-3 w-3 text-green-600 ml-1" strokeWidth={2} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500 mr-1" strokeWidth={2} />
                        <span className="text-xs font-bold text-yellow-700">{setter.bookings || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-bold ${
                        (setter.conversionRate || 0) >= 10 ? 'text-green-600' :
                        (setter.conversionRate || 0) >= 5 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {setter.conversionRate || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 text-gray-400 mr-1" strokeWidth={2} />
                        <span className="text-xs text-gray-600">{setter.avgDuration}s</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedSetter(setter);
                          setShowCallsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                        title="View call details"
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {setters.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">No setter activity found</p>
              <p className="text-xs text-gray-500 mt-1">Make sure numbers are assigned to GHL users</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Breakdown */}
      {setters.length > 0 && (
        <div className="modern-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Dial Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setters.slice(0, 6).map((setter) => {
              const days = Object.keys(setter.callsByDay || {}).sort().reverse();
              
              return (
                <div key={setter.userId} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-900 mb-2">{setter.userName}</p>
                  <div className="space-y-1.5">
                    {days.slice(0, 7).map((day) => {
                      const callCount = setter.callsByDay[day];
                      const date = new Date(day);
                      const isToday = day === today;
                      
                      return (
                        <div key={day} className="flex items-center justify-between">
                          <span className={`text-xs ${isToday ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                            {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className={`text-xs font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {callCount} calls
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showCallsModal && selectedSetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedSetter.userName}</h3>
                <p className="text-xs text-gray-600">{selectedSetter.email}</p>
              </div>
              <button
                onClick={() => setShowCallsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            
            <div className="p-6">
              {callsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading call details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Total Calls" value={selectedSetter.totalCalls} icon={Phone} color="brand" />
                    <StatCard label="Completed" value={selectedSetter.completedCalls} icon={Activity} color="success" />
                    <StatCard label="Bookings" value={selectedSetter.bookings || 0} icon={Trophy} color="warning" />
                    <StatCard label="Answer Rate" value={`${selectedSetter.answerRate}%`} icon={TrendingUp} color="brand" />
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Own Number Calls:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSetter.ownNumberCalls}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">State Number Calls:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSetter.stateNumberCalls}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversion Rate:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSetter.conversionRate || 0}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Duration:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSetter.avgDuration}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}