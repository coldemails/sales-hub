import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import LoadingBanner from '../components/Loadingbanner';
import { StatCard } from '../components/Card';
import { 
  Phone,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Loader2,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

export default function CallAnalytics() {
  const [selectedDays, setSelectedDays] = useState(1);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['call-analytics', getDaysToFetch(), customStartDate, customEndDate],
    queryFn: async () => {
      const response = await analyticsApi.getOverview(getDaysToFetch());
      return response.data?.data || response.data;
    },
    staleTime: 3 * 60 * 1000,
  });

  const { data: numberDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['number-analytics', selectedNumber?.phoneNumber, selectedDays],
    queryFn: async () => {
      if (!selectedNumber) return null;
      const response = await analyticsApi.getNumberAnalytics(
        encodeURIComponent(selectedNumber.phoneNumber),
        selectedDays
      );
      return response.data?.data || response.data;
    },
    enabled: !!selectedNumber,
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
        <p className="text-red-600 font-medium">Error loading analytics: {error.message}</p>
        <p className="text-sm text-gray-600 mt-2">Make sure your Twilio account has call logs.</p>
      </div>
    );
  }

  const numbers = data?.numbers || [];
  const summary = data?.summary || {};

  const getNumberRole = (phoneNumber) => {
    if (phoneNumber.includes('510')) return 'setter';
    if (phoneNumber.includes('650')) return 'closer';
    return 'state';
  };

  const setters = numbers.filter(n => getNumberRole(n.phoneNumber) === 'setter');
  const closers = numbers.filter(n => getNumberRole(n.phoneNumber) === 'closer');
  const states = numbers.filter(n => getNumberRole(n.phoneNumber) === 'state');
  const highRiskNumbers = numbers.filter(n => n.spamRisk === 'high');

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
          <h2 className="text-2xl font-bold text-gray-900">Call Performance Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">Track call success rates and identify spam-flagged numbers</p>
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

      {/* Spam Detection Explanation */}
      <div className="modern-card border border-blue-300 p-4">
        <div className="flex items-start">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-gray-900">How Spam Detection Works</h3>
            <p className="text-xs text-gray-600 mt-1">
              Numbers are flagged based on answer rate (completed calls ÷ total calls)
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-700">
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                <span><strong>High Risk:</strong> Answer rate &lt; 30% with 10+ calls</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                <span><strong>Medium Risk:</strong> Answer rate 30-50%</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span><strong>Good:</strong> Answer rate &gt; 50%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Alert */}
      {highRiskNumbers.length > 0 && (
        <div className="modern-card border border-red-300 p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {highRiskNumbers.length} Number{highRiskNumbers.length > 1 ? 's' : ''} Flagged as High Risk
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                These numbers have answer rates below 30% and may be marked as spam.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {highRiskNumbers.slice(0, 5).map(n => (
                  <span key={n.phoneNumber} className="text-xs font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    {n.phoneNumber} ({n.answerRate}%)
                  </span>
                ))}
                {highRiskNumbers.length > 5 && (
                  <span className="text-xs text-red-600">+{highRiskNumbers.length - 5} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Calls" value={summary.totalCalls || 0} icon={Activity} color="brand" />
        <StatCard label="High Risk (Spam)" value={summary.highRiskNumbers || 0} icon={AlertTriangle} color="danger" />
        <StatCard label="Medium Risk" value={summary.mediumRiskNumbers || 0} icon={TrendingDown} color="warning" />
        <StatCard label="Good Numbers" value={summary.goodNumbers || 0} icon={CheckCircle2} color="success" />
      </div>

      {/* Performance by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="modern-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Setters (510)</h3>
            <span className="text-xl font-bold text-blue-600">{setters.length}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">High Risk:</span>
              <span className="font-semibold text-red-600">
                {setters.filter(n => n.spamRisk === 'high').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Calls:</span>
              <span className="font-semibold text-gray-900">
                {setters.reduce((sum, n) => sum + n.totalCalls, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="modern-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Closers (650)</h3>
            <span className="text-xl font-bold text-blue-600">{closers.length}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">High Risk:</span>
              <span className="font-semibold text-red-600">
                {closers.filter(n => n.spamRisk === 'high').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Calls:</span>
              <span className="font-semibold text-gray-900">
                {closers.reduce((sum, n) => sum + n.totalCalls, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="modern-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">State Numbers</h3>
            <span className="text-xl font-bold text-blue-600">{states.length}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">High Risk:</span>
              <span className="font-semibold text-red-600">
                {states.filter(n => n.spamRisk === 'high').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Calls:</span>
              <span className="font-semibold text-gray-900">
                {states.reduce((sum, n) => sum + n.totalCalls, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Number Performance Table */}
      <div className="modern-card overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Number Performance Details</h3>
          <p className="text-xs text-gray-600 mt-0.5">Sorted by spam risk (high risk first)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Answered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No Answer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Failed</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Answer Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Avg Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {numbers.map((number) => {
                const role = getNumberRole(number.phoneNumber);
                const roleLabels = { setter: 'Setter', closer: 'Closer', state: 'State' };

                return (
                  <tr key={number.phoneNumber} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-gray-900">{number.phoneNumber}</p>
                      <p className="text-xs text-gray-500 truncate">{number.friendlyName || 'No name'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {roleLabels[role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900 font-semibold">{number.totalCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-green-600 font-semibold">{number.completedCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{number.noAnswerCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-red-600 font-semibold">{number.failedCalls}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-xs font-bold ${
                          number.answerRate >= 50 ? 'text-green-600' :
                          number.answerRate >= 30 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {number.answerRate}%
                        </span>
                        {number.answerRate >= 50 ? (
                          <TrendingUp className="h-3 w-3 text-green-600 ml-1" strokeWidth={2} />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600 ml-1" strokeWidth={2} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" strokeWidth={2} />
                        {number.avgDuration}s
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {number.spamRisk === 'high' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" strokeWidth={2} />
                          High Risk
                        </span>
                      )}
                      {number.spamRisk === 'medium' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Warning
                        </span>
                      )}
                      {number.spamRisk === 'good' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={2} />
                          Good
                        </span>
                      )}
                      {number.spamRisk === 'no-data' && (
                        <span className="text-xs text-gray-400">No data</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedNumber(number);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                        {number.spamRisk === 'high' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Replace ${number.phoneNumber}?\n\nThis number has low answer rate (${number.answerRate}%) and may be spam-flagged.`)) {
                                alert('Release functionality coming soon!');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                            title="Replace Number"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {numbers.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">No call data available</p>
              <p className="text-xs text-gray-500 mt-1">Make some calls to see analytics</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      {numbers.length > 0 && (
        <div className="modern-card border border-blue-300 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Insights & Recommendations</h3>
          <div className="space-y-2 text-xs text-gray-700">
            {highRiskNumbers.length > 0 && (
              <p>• <strong className="text-red-600">{highRiskNumbers.length} numbers flagged as high risk</strong> - Consider replacing these</p>
            )}
            {summary.mediumRiskNumbers > 0 && (
              <p>• <strong className="text-yellow-600">{summary.mediumRiskNumbers} numbers show warning signs</strong> - Monitor closely</p>
            )}
            {summary.goodNumbers > 0 && (
              <p>• <strong className="text-green-600">{summary.goodNumbers} numbers performing well</strong> - Keep using these</p>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedNumber.phoneNumber}</h3>
                  <p className="text-xs text-gray-600">{selectedNumber.friendlyName || 'No name'}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Total Calls" value={selectedNumber.totalCalls} icon={Phone} color="brand" />
                    <StatCard label="Completed" value={selectedNumber.completedCalls} icon={CheckCircle2} color="success" />
                    <StatCard label="No Answer" value={selectedNumber.noAnswerCalls} icon={XCircle} color="warning" />
                    <StatCard label="Failed" value={selectedNumber.failedCalls} icon={AlertTriangle} color="danger" />
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600">
                      Answer Rate: <span className="font-bold text-gray-900">{selectedNumber.answerRate}%</span> | 
                      Avg Duration: <span className="font-bold text-gray-900">{selectedNumber.avgDuration}s</span>
                    </p>
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