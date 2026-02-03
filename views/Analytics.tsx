import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AnalyticsFilter, AnalyticsResponse, PaymentMode, ParcelStatus } from '../types';
import { getOrganizationAnalytics, getBranchAnalytics } from '../services/apiService';
import { 
  BarChart3, 
  Package, 
  Filter, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Building2,
  Bus,
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Analytics: React.FC = () => {
  const { currentUser, offices, buses, fetchAdminBranches, fetchBuses, updateParcelStatus } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  
  const [filters, setFilters] = useState<AnalyticsFilter>({
    page: 1,
    pageSize: 50
  });

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (currentUser) {
      // Try to fetch branches for both admin types (branch admins might have limited access)
      fetchAdminBranches().catch(() => {
        // Silently fail if branch admin doesn't have access - backend will handle filtering
      });
      fetchBuses();
    }
  }, [currentUser, fetchAdminBranches, fetchBuses]);

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchAnalytics = async (customFilters?: AnalyticsFilter) => {
    if (!currentUser) return;
    
    setLoading(true);
    const targetFilters = customFilters || filters;

    try {
      // Format filters for API - convert dates to ISO strings
      const apiFilters: any = {
        start_date: targetFilters.startDate ? `${targetFilters.startDate}T00:00:00.000Z` : undefined,
        end_date: targetFilters.endDate ? `${targetFilters.endDate}T23:59:59.999Z` : undefined,
        status: targetFilters.status && targetFilters.status.length > 0 ? targetFilters.status : undefined,
        branch_slug: targetFilters.branchSlug,
        source_branch_slug: targetFilters.sourceBranchSlug,
        destination_branch_slug: targetFilters.destinationBranchSlug,
        bus_slug: targetFilters.busSlug,
        payment_mode: targetFilters.paymentMode,
        min_price: targetFilters.minPrice,
        max_price: targetFilters.maxPrice,
        search: targetFilters.search,
        page: targetFilters.page || 1,
        page_size: targetFilters.pageSize || 50
      };
      
      // Remove undefined values
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === undefined || apiFilters[key] === null || apiFilters[key] === '') {
          delete apiFilters[key];
        }
      });
      
      const response = isSuperAdmin 
        ? await getOrganizationAnalytics(apiFilters)
        : await getBranchAnalytics(apiFilters);
      
      if (response.status === 200 && response.data) {
        setAnalyticsData(response.data);
      } else {
        alert(response.message || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AnalyticsFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearAllFilters = () => {
    const defaultFilters = { page: 1, pageSize: 50 };
    setFilters(defaultFilters);
    fetchAnalytics(defaultFilters);
  };

  const handleApplyFilters = () => {
    const updatedFilters = { ...filters, page: 1 };
    setFilters(updatedFilters);
    fetchAnalytics(updatedFilters);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'IN_TRANSIT':
        return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'ARRIVED':
        return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
      case 'BOOKED':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };
  const handleUpdateStatus = async (trackingId: string, newStatus: ParcelStatus, remarks: string) => {
    const res = await updateParcelStatus(trackingId, newStatus, remarks);
    if (res.success) {
      // Manually update the local state to show the change
      setAnalyticsData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map(item => 
            item.tracking_id === trackingId 
              ? { ...item, current_status: newStatus } 
              : item
          )
        };
      });
    } else {
      alert(res.message);
    }
  };

  const renderActionShortcut = (item: any) => {
    if (isSuperAdmin) return null;
    
    const myOfficeId = currentUser?.officeId;
    const isSource = item.source_branch?.slug === myOfficeId;
    const isDest = item.destination_branch?.slug === myOfficeId;

    if (isSource && item.current_status === ParcelStatus.BOOKED) {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            await handleUpdateStatus(item.tracking_id, ParcelStatus.IN_TRANSIT, "Dispatched from analytics");
          }}
          className="px-3 py-1 bg-slate-950 text-white text-[9px] font-bold uppercase tracking-[0.1em] border-l-2 border-orange-500 hover:bg-orange-600 transition-all duration-300 active:scale-95 shadow-lg whitespace-nowrap"
        >
          Mark as In Transit
        </button>
      );
    }

    if (isDest && item.current_status === ParcelStatus.IN_TRANSIT) {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            await handleUpdateStatus(item.tracking_id, ParcelStatus.ARRIVED, "Arrived at destination");
          }}
          className="px-3 py-1 bg-slate-950 text-white text-[9px] font-bold uppercase tracking-[0.1em] border-l-2 border-sky-500 hover:bg-sky-600 transition-all duration-300 active:scale-95 shadow-lg whitespace-nowrap"
        >
          Mark as Arrived
        </button>
      );
    }

    return (
      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">
        No Action
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0"></span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-brand">Shipment Reports</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-brand font-bold text-slate-900 tracking-tight">Shipment List</h2>
          <p className="text-slate-500 text-xs font-medium mt-1 break-words">View and filter all shipments across your network.</p>
        </div>
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/20 w-full sm:w-auto justify-center sm:justify-start">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Records</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-brand font-bold text-slate-900">Filters</h3>
          </div>
          <button
            onClick={handleClearAllFilters}
            className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all uppercase tracking-widest active:scale-95 w-full sm:w-auto"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              />
            </div>
          </div>

          {/* Status Multi-select */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {['BOOKED', 'IN_TRANSIT', 'ARRIVED'].map((status) => (
                <label key={status} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const currentStatuses = filters.status || [];
                      const newStatuses = e.target.checked
                        ? [...currentStatuses, status]
                        : currentStatuses.filter(s => s !== status);
                      handleFilterChange('status', newStatuses.length > 0 ? newStatuses : undefined);
                    }}
                    className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 flex-shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-700 whitespace-nowrap">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source Branch */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Source Branch</label>
            <div className="relative">
              <ArrowUpRight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filters.sourceBranchSlug || ''}
                onChange={(e) => handleFilterChange('sourceBranchSlug', e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              >
                <option value="">All Starting Branches</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>{office.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Branch */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Destination Branch</label>
            <div className="relative">
              <ArrowDownRight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filters.destinationBranchSlug || ''}
                onChange={(e) => handleFilterChange('destinationBranchSlug', e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              >
                <option value="">All Ending Branches</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>{office.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bus */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Bus</label>
            <div className="relative">
              <Bus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filters.busSlug || ''}
                onChange={(e) => handleFilterChange('busSlug', e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              >
                <option value="">All Buses</option>
                {buses.map(bus => (
                  <option key={bus.slug} value={bus.slug}>{bus.busNumber}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Payment Mode</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filters.paymentMode || ''}
                onChange={(e) => handleFilterChange('paymentMode', e.target.value || undefined)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              >
                <option value="">All Modes</option>
                <option value={PaymentMode.SENDER_PAYS}>Sender Pays</option>
                <option value={PaymentMode.RECEIVER_PAYS}>Receiver Pays</option>
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Min Price</label>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="100000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                placeholder="Tracking ID, Sender, Receiver..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/30"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#F97316] text-white font-bold rounded-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs sm:text-xs active:scale-95"
        >
          {loading ? 'Loading...' : 'Show Results'}
        </button>
      </div>


      {/* Data Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-brand font-bold text-base sm:text-lg text-slate-900 tracking-tight">Results</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-0.5">Shipments Found</p>
          </div>
          {analyticsData && (
            <div className="text-[10px] sm:text-xs text-slate-600 font-bold">
              Showing {((analyticsData.pagination.page - 1) * analyticsData.pagination.page_size) + 1} - {Math.min(analyticsData.pagination.page * analyticsData.pagination.page_size, analyticsData.pagination.total)} of {analyticsData.pagination.total}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 sm:py-16 text-center px-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Loading shipments...</p>
          </div>
        ) : !analyticsData || analyticsData.data.length === 0 ? (
          <div className="py-12 sm:py-16 text-center px-4">
            <div className="bg-slate-50 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-brand text-slate-800 mb-1">No data available</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-xs leading-relaxed">Try adjusting your filters to see results.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {analyticsData.data.map((item, idx) => {
                const paidAmount = item.payment_mode === PaymentMode.SENDER_PAYS ? parseFloat(item.price) : 0;
                const toPay = item.payment_mode === PaymentMode.RECEIVER_PAYS ? parseFloat(item.price) : 0;
                
                return (
                  <div
                    key={item.slug}
                    onClick={() => navigate(`/shipments/${item.tracking_id}`)}
                    className="p-4 hover:bg-slate-50 transition-all cursor-pointer active:bg-slate-100"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-brand font-bold text-sm text-slate-900 block truncate">{item.tracking_id}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tracking ID</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-400 font-bold font-brand">{formatTime(item.created_at)}</div>
                        <div className="text-[9px] text-slate-500">{formatDate(item.day || item.created_at)}</div>
                      </div>
                    </div>

                    <div className="flex justify-end mb-3">
                       {renderActionShortcut(item)}
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">To</span>
                          <div className="text-xs font-bold text-slate-900 truncate">{item.receiver_name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{item.receiver_phone}</div>
                          {item.destination_branch && (
                            <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{item.destination_branch.title}</div>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">From</span>
                          <div className="text-xs font-bold text-slate-900 truncate">{item.sender_name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{item.sender_phone}</div>
                          {item.source_branch && (
                            <div className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{item.source_branch.title}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Bus</span>
                          <div className="text-xs text-slate-600">{item.bus ? item.bus.bus_number : '-'}</div>
                        </div>
                        <div className="text-right">
                          {paidAmount > 0 && (
                            <div className="mb-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Paid</span>
                              <div className="text-xs font-bold text-emerald-600">{formatCurrency(paidAmount.toString())}</div>
                            </div>
                          )}
                          {toPay > 0 && (
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">To Pay</span>
                              <div className="text-xs font-bold text-orange-600">{formatCurrency(toPay.toString())}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {item.description && item.description.trim() !== '' && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Description</span>
                          <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                     <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">Tracking ID</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">Date</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">To</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">From</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">Prices</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">Status</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand">Route</th>
                    <th className="px-4 lg:px-6 py-3 text-[10px] font-bold uppercase tracking-widest font-brand text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData.data.map((item, idx) => {
                    const paidAmount = item.payment_mode === PaymentMode.SENDER_PAYS ? parseFloat(item.price) : 0;
                    const toPay = item.payment_mode === PaymentMode.RECEIVER_PAYS ? parseFloat(item.price) : 0;
                    
                    return (
                      <React.Fragment key={item.slug}>
                        <tr 
                          className="hover:bg-slate-50 transition-all group cursor-pointer"
                          onClick={() => navigate(`/shipments/${item.tracking_id}`)}
                        >
                          <td className="px-4 lg:px-6 py-4" rowSpan={2}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-none bg-slate-950 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                <Package className="w-4 h-4" />
                              </div>
                              <span className="font-brand font-bold text-sm text-slate-900 tracking-tight">{item.tracking_id}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-xs text-slate-900 font-bold font-brand">
                            {formatDate(item.day || item.created_at)}
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-xs">
                            <div className="font-bold text-slate-800">{item.receiver_name}</div>
                            <div className="text-slate-500 text-[10px] font-bold">{item.receiver_phone}</div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-xs">
                            <div className="font-bold text-slate-800">{item.sender_name}</div>
                            <div className="text-slate-500 text-[10px] font-bold">{item.sender_phone}</div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {paidAmount > 0 && <div className="text-[10px] font-bold text-emerald-600">PAID: {formatCurrency(paidAmount.toString())}</div>}
                              {toPay > 0 && <div className="text-[10px] font-bold text-orange-600">TOPAY: {formatCurrency(toPay.toString())}</div>}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-none border-l-2 text-[8px] font-bold uppercase tracking-widest ${getStatusColor(item.current_status)}`}>
                              {item.current_status.toLowerCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{item.source_branch?.title || 'Source'}</span>
                              <ArrowRight className="w-3 h-3 text-orange-500" />
                              <span className="text-[10px] font-bold text-slate-900 truncate max-w-[80px]">{item.destination_branch?.title || 'Dest'}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-right">
                             {renderActionShortcut(item)}
                          </td>
                        </tr>
                        <tr 
                          className="hover:bg-slate-50 transition-all group cursor-pointer border-b border-slate-100"
                          onClick={() => navigate(`/shipments/${item.tracking_id}`)}
                        >
                          <td colSpan={7} className="px-4 lg:px-6 py-2 text-[10px] text-slate-500 bg-slate-50/30">
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-brand">Description:</span>
                              <span className="truncate italic">
                                {item.description && item.description.trim() !== '' ? item.description : 'No description'}
                              </span>
                              {item.bus && (
                                <>
                                  <span className="ml-4 text-[8px] font-bold text-slate-400 uppercase tracking-widest font-brand">Bus:</span>
                                  <span className="font-bold text-slate-700">{item.bus.bus_number}</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {analyticsData.pagination.total_pages > 1 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <button
                  onClick={() => {
                    const newPage = (analyticsData.pagination.page - 1);
                    const newFilters = { ...filters, page: newPage };
                    setFilters(newFilters);
                    fetchAnalytics(newFilters);
                  }}
                  disabled={analyticsData.pagination.page === 1}
                  className="flex items-center gap-2 px-3 py-2 sm:py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                  {Array.from({ length: Math.min(5, analyticsData.pagination.total_pages) }, (_, i) => {
                    const page = analyticsData.pagination.page <= 3 
                      ? i + 1 
                      : analyticsData.pagination.page >= analyticsData.pagination.total_pages - 2
                      ? analyticsData.pagination.total_pages - 4 + i
                      : analyticsData.pagination.page - 2 + i;
                    
                    if (page < 1 || page > analyticsData.pagination.total_pages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          const newFilters = { ...filters, page };
                          setFilters(newFilters);
                          fetchAnalytics(newFilters);
                        }}
                        className={`px-3 py-1.5 sm:py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                          page === analyticsData.pagination.page
                            ? 'bg-[#F97316] text-white'
                            : 'text-slate-600 border border-slate-200 hover:bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    const newPage = (analyticsData.pagination.page + 1);
                    const newFilters = { ...filters, page: newPage };
                    setFilters(newFilters);
                    fetchAnalytics(newFilters);
                  }}
                  disabled={analyticsData.pagination.page === analyticsData.pagination.total_pages}
                  className="flex items-center gap-2 px-3 py-2 sm:py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
