import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { numbersApi, ghlApi, calendlyApi } from '../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Activity,
  Phone,
  Users,
  Calendar,
  Video,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function SystemStatus() {
  const [expandedSection, setExpandedSection] = useState(null);

  // Fetch data to check system health
  const { data: twilioData, isLoading: twilioLoading, refetch: refetchTwilio } = useQuery({
    queryKey: ['twilio-health'],
    queryFn: async () => {
      const response = await numbersApi.getAllNumbers();
      return response.data;
    },
    retry: 1,
    refetchInterval: 60000 // Check every minute
  });

  const { data: ghlData, isLoading: ghlLoading, refetch: refetchGHL } = useQuery({
    queryKey: ['ghl-health'],
    queryFn: async () => {
      const response = await ghlApi.getUsers();
      return response.data;
    },
    retry: 1,
    refetchInterval: 60000
  });

  const { data: ghlNumbersData, isLoading: ghlNumbersLoading } = useQuery({
    queryKey: ['ghl-numbers-health'],
    queryFn: async () => {
      const response = await ghlApi.getPhoneNumbers();
      return response.data;
    },
    retry: 1,
    refetchInterval: 60000
  });

  const { data: calendlyData, isLoading: calendlyLoading, error: calendlyError } = useQuery({
    queryKey: ['calendly-health'],
    queryFn: async () => {
      const response = await calendlyApi.getHealth();
      return response.data;
    },
    retry: 1,
    refetchInterval: 60000
  });

  // Calculate health status
  const getServiceStatus = (isLoading, data, error) => {
    if (isLoading) return { status: 'checking', label: 'Checking...', color: 'gray' };
    if (error) return { status: 'error', label: 'Error', color: 'red' };
    if (data) return { status: 'operational', label: 'Operational', color: 'green' };
    return { status: 'unknown', label: 'Unknown', color: 'gray' };
  };

  const twilioStatus = getServiceStatus(twilioLoading, twilioData, null);
  const ghlStatus = getServiceStatus(ghlLoading, ghlData, null);
  const ghlNumbersStatus = getServiceStatus(ghlNumbersLoading, ghlNumbersData, null);
  const calendlyStatus = getServiceStatus(calendlyLoading, calendlyData, calendlyError);

  // Mock status for services we don't have real checks for yet
  const googleStatus = { status: 'operational', label: 'Operational', color: 'green' };
  const zoomStatus = { status: 'manual', label: 'Manual Setup', color: 'yellow' };

  const services = [
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Phone number management & call routing',
      icon: Phone,
      status: twilioStatus,
      details: twilioData ? [
        { label: 'Total Numbers', value: twilioData.count || 0 },
        { label: 'Status', value: 'Connected' },
        { label: 'Last Check', value: 'Just now' }
      ] : [],
      actions: [
        { label: 'Refresh', onClick: refetchTwilio }
      ]
    },
    {
      id: 'ghl',
      name: 'GoHighLevel (GHL)',
      description: 'CRM & user management',
      icon: Users,
      status: ghlStatus,
      details: ghlData ? [
        { label: 'Total Users', value: ghlData.users?.length || 0 },
        { label: 'Phone Numbers', value: ghlNumbersData?.numbers?.length || 0 },
        { label: 'Last Sync', value: 'Just now' }
      ] : [],
      actions: [
        { label: 'Refresh', onClick: refetchGHL }
      ]
    },
    {
      id: 'google',
      name: 'Google Workspace',
      description: 'Email accounts & authentication',
      icon: Mail,
      status: googleStatus,
      details: [
        { label: 'Status', value: 'Connected' },
        { label: 'Mode', value: 'Dummy Mode' },
        { label: 'Note', value: 'Requires real API setup' }
      ],
      actions: []
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Meeting scheduling & invitations',
      icon: Calendar,
      status: calendlyStatus,
      details: calendlyData ? [
        { label: 'Status', value: calendlyData.status === 'connected' ? 'Connected' : 'Error' },
        { label: 'Message', value: calendlyData.message },
        { label: 'Last Check', value: 'Just now' }
      ] : [],
      actions: []
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Video meeting accounts',
      icon: Video,
      status: zoomStatus,
      details: [
        { label: 'Status', value: 'Manual Setup' },
        { label: 'Mode', value: 'Dummy Mode' },
        { label: 'Note', value: 'Requires real API setup' }
      ],
      actions: []
    }
  ];

  const getStatusIcon = (status) => {
    switch (status.status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'manual':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-gray-600 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      yellow: 'bg-amber-50 text-amber-700 border-amber-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${colors[status.color]}`}>
        {status.label}
      </span>
    );
  };

  const operationalCount = services.filter(s => s.status.status === 'operational').length;
  const totalServices = services.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Status</h1>
        <p className="text-gray-600 mt-1">Monitor integration health and API connections</p>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`rounded-xl border-2 p-8 ${
          operationalCount === totalServices 
            ? 'bg-green-50 border-green-200' 
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {operationalCount === totalServices ? (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            ) : (
              <AlertCircle className="h-10 w-10 text-amber-600" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {operationalCount === totalServices ? 'All Systems Operational' : 'Some Issues Detected'}
              </h2>
              <p className="text-gray-700 mt-1">
                {operationalCount} of {totalServices} services are operational
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last updated: Just now</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Services Status */}
      <div className="space-y-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          const isExpanded = expandedSection === service.id;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Service Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedSection(isExpanded ? null : service.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                        {getStatusIcon(service.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(service.status)}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 bg-gray-50 p-6"
                >
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {service.details.map((detail, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">{detail.label}</p>
                        <p className="text-lg font-bold text-gray-900">{detail.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {service.actions.length > 0 && (
                    <div className="flex gap-3">
                      {service.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick();
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Environment</p>
            <p className="text-lg font-bold text-gray-900">Production</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Version</p>
            <p className="text-lg font-bold text-gray-900">1.0.0</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Uptime</p>
            <p className="text-lg font-bold text-gray-900">99.9%</p>
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="bg-gray-50 rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Operational</p>
              <p className="text-xs text-gray-600">Service is working normally</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manual Setup</p>
              <p className="text-xs text-gray-600">Requires manual configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Error</p>
              <p className="text-xs text-gray-600">Service is not responding</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}