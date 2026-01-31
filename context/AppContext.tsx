import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Office, Parcel, ParcelStatus, TrackingEvent, UserRole, NotificationLog, PaymentMode, Bus } from '../types';
import { fetchHealth, fetchBranches, loginOrganization, loginBranch, logoutUser, createApiClient } from '../services/apiService';
import { jwtDecode } from 'jwt-decode';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';



interface AppContextType {
  currentUser: User | null;
  organization: any | null;
  offices: Office[];
  buses: Bus[];
  parcels: Parcel[];
  notifications: NotificationLog[];
  loading: boolean;
  login: (role: UserRole, credentials: { id?: string, password?: string }) => Promise<{ success: boolean, message: string }>;
  logout: () => Promise<void>;
  addOffice: (officeData: { name: string, password?: string }) => Promise<{ success: boolean, message: string }>;
  deleteOffice: (officeId: string) => Promise<{ success: boolean, message: string }>;
  fetchAdminBranches: () => Promise<void>;
  addBus: (busData: { busNumber: string, preferredDays: number[], description?: string }) => Promise<{ success: boolean, message: string }>;
  deleteBus: (busSlug: string) => Promise<{ success: boolean, message: string }>;
  fetchBuses: () => Promise<void>;
  createParcel: (parcel: any) => Promise<{ success: boolean, message: string, data?: any }>;
  updateParcelStatus: (trackingId: string, newStatus: ParcelStatus, note?: string) => Promise<{ success: boolean, message: string }>;
  fetchParcels: () => Promise<void>;
  trackShipment: (id: string) => Promise<{ success: boolean, data?: Parcel, message?: string }>;
  getShipmentDetails: (id: string) => Promise<{ success: boolean, data?: Parcel, message?: string }>;
  getOfficeName: (id: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// MOCK DATA
const MOCK_OFFICES: Office[] = [];

const MOCK_USERS: User[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const api = useMemo(() => createApiClient(() => {
    // Auto logout on unauthorized
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    navigate('/');
  }), [navigate]);

  useEffect(() => {
    const initializeApp = async () => {
      // Use a temporary client for initial setup (without logout yet)
      const initApi = createApiClient();

      try {
        const healthData = await initApi.get('/organization/info/');
        // Backend returns: { message, data, error } with HTTP status code
        if (healthData.status === 200 && healthData.data) {
          setOrganization(healthData.data);

          let mappedOffices: Office[] = [];
          // Use bundled branches from health check
          if (healthData.data.branches && Array.isArray(healthData.data.branches) && healthData.data.branches.length > 0) {
            mappedOffices = healthData.data.branches.map((b: any) => ({
              id: b.slug,
              name: b.title,
              username: b.owner?.username || '' // Store owner username for login
            }));
            setOffices(mappedOffices);
          } else {
            // If no branches in response, set empty array explicitly
            setOffices([]);
          }

          // Check if we have a saved token and restore session
          const access = localStorage.getItem('access_token');
          if (access) {
            try {
              const decoded: any = jwtDecode(access);
              const currentTime = Date.now() / 1000;
              if (decoded.exp > currentTime) {
                // JWT uses 'sub' for user ID and 'login_type' in extra_claims
                const loginType = decoded.login_type || (decoded.sub_type); // fallback for compatibility
                const userId = decoded.sub || decoded.sub_id; // fallback for compatibility
                
                const user: User = {
                  id: userId,
                  name: loginType === 'organization'
                    ? healthData.data.title
                    : mappedOffices.find((o: any) => o.id === userId)?.name || 'Branch Manager',
                  role: loginType === 'organization' ? UserRole.SUPER_ADMIN : UserRole.OFFICE_ADMIN,
                  officeId: loginType === 'branch' ? userId : undefined
                };
                setCurrentUser(user);

                // If admin, also fetch the full branch details
                if (user.role === UserRole.SUPER_ADMIN) {
                  const adminApi = createApiClient(); // Use local since api useMemo might not be ready in exact same tick
                  const adminBranches = await adminApi.get('/branch/list/');
                  if (adminBranches.status === 200 && adminBranches.data) {
                    const mapped = adminBranches.data.map((b: any) => ({
                      id: b.slug,
                      name: b.title,
                      username: b.owner?.username || '' // Store owner username for login
                    }));
                    setOffices(mapped);
                  }
                }
              } else {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
              }
            } catch (e) {
              console.error("Token restore failed:", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
    // Note: fetchParcels will be called after login or when components mount
  }, []);

  // Helper to log "SMS"
  const sendFakeSMS = (recipient: string, phone: string, message: string) => {
    const newLog: NotificationLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      recipient,
      phone,
      message
    };
    setNotifications(prev => [newLog, ...prev]);
  };

  const login = async (role: UserRole, credentials: { id?: string, password?: string }) => {
    try {
      let data;
      if (role === UserRole.SUPER_ADMIN) {
        // For organization login, username is the organization owner's username
        const orgUsername = organization?.owner?.username || '';
        if (!orgUsername) {
          return { success: false, message: 'Organization owner username not found' };
        }
        data = await loginOrganization(orgUsername, credentials.password || '');
      } else if (role === UserRole.OFFICE_ADMIN) {
        // For branch login, username is the branch owner's username
        const selectedBranch = offices.find((o: any) => o.id === credentials.id);
        const branchUsername = selectedBranch?.username || '';
        if (!branchUsername) {
          return { success: false, message: 'Branch owner username not found' };
        }
        data = await loginBranch(branchUsername, credentials.password || '');
      } else {
        // Public/Tracking - stays mock/session-less for now
        setCurrentUser({ id: 'public', name: 'Guest', role: UserRole.PUBLIC });
        return { success: true, message: 'Logged in as guest' };
      }

      // Backend returns: { message, data: { access, refresh }, error } with HTTP status code
      if (data.status === 200 && data.data) {
        const { access, refresh } = data.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        const decoded: any = jwtDecode(access);
        // JWT uses 'sub' for user ID and 'login_type' in extra_claims
        const userId = decoded.sub || decoded.sub_id; // fallback for compatibility
        const loginType = decoded.login_type || decoded.sub_type; // fallback for compatibility
        
        // Get name from organization context or branch lookup
        const name = role === UserRole.SUPER_ADMIN
          ? organization?.title || 'Organization Admin'
          : offices.find((o: any) => o.id === credentials.id)?.name || 'Branch Manager';

        const user: User = {
          id: userId,
          name: name,
          role: role,
          // For branch admin, officeId should be the branch slug (credentials.id), not userId
          // userId is the branch owner's username which equals branch.slug, so they should match
          // But to be safe, use credentials.id if available (the branch slug selected during login)
          officeId: role === UserRole.OFFICE_ADMIN ? (credentials.id || userId) : undefined
        };
        
        console.log("Login - Setting user:", user, "credentials.id:", credentials.id, "userId:", userId);

        setCurrentUser(user);

        // If admin, refetch branches to get full details
        if (role === UserRole.SUPER_ADMIN) {
          await fetchAdminBranches();
        }

        await fetchParcels();

        return { success: true, message: data.message };
      }
      else {
        return { success: false, message: data.message || data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, message: error.message || 'An error occurred during login' };
    }
  };

  const logout = useCallback(async () => {
    // Logout endpoint uses token from Authorization header, no body needed
    try {
      await logoutUser();
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    navigate('/');
  }, [navigate]);

  const fetchAdminBranches = useCallback(async () => {
    try {
      const data = await api.get('/branch/list/');
      // Backend returns: { message, data: [...], error } with HTTP status code
      if (data.status === 200 && data.data) {
        const mapped = data.data.map((b: any) => ({
          id: b.slug,
          name: b.title,
          username: b.owner?.username || '' // Store owner username for login
        }));
        setOffices(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch admin branches:", e);
    }
  }, [api]);

  const addOffice = async (officeData: { name: string, password?: string }) => {
    try {
      const data = await api.post('/branch/add/', {
        title: officeData.name,
        password: officeData.password || 'default_branch_pass'
      });

      // Backend returns status 200 for branch creation
      if (data.status === 200 && data.data) {
        await fetchAdminBranches(); // Refresh the list
        return { success: true, message: data.message || 'Office created successfully' };
      }
      return { success: false, message: data.message || data.error || 'Creation failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const deleteOffice = async (officeId: string) => {
    try {
      const data = await api.delete(`/branch/${officeId}/delete/`);
      if (data.status === 200 || data.status_code === 200) {
        await fetchAdminBranches();
        return { success: true, message: 'Office deleted' };
      }
      return { success: false, message: data.message || 'Deletion failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const fetchBuses = useCallback(async () => {
    try {
      const data = await api.get('/bus/list/');
      if (data.status === 200 && data.data) {
        const mapped = data.data.map((b: any) => ({
          slug: b.slug,
          busNumber: b.bus_number,
          preferredDays: b.preferred_days || [],
          description: b.description
        }));
        setBuses(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch buses:", e);
      setBuses([]);
    }
  }, [api]);

  const addBus = async (busData: { busNumber: string, preferredDays: number[], description?: string }) => {
    try {
      const data = await api.post('/bus/add/', {
        bus_number: busData.busNumber,
        preferred_days: busData.preferredDays,
        description: busData.description || null
      });

      if (data.status === 200 && data.data) {
        await fetchBuses();
        return { success: true, message: data.message || 'Bus created successfully' };
      }
      return { success: false, message: data.message || data.error || 'Creation failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const deleteBus = async (busSlug: string) => {
    try {
      // Note: We might need to add a delete endpoint, but for now let's assume it exists
      const data = await api.delete(`/bus/${busSlug}/delete/`);
      if (data.status === 200 || data.status_code === 200) {
        await fetchBuses();
        return { success: true, message: 'Bus deleted successfully' };
      }
      return { success: false, message: data.message || 'Deletion failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const getOfficeName = (id: string) => offices.find(o => o.id === id)?.name || 'Unknown Office';

  const fetchParcels = useCallback(async () => {
    // Don't fetch if user is not logged in
    if (!currentUser) {
      console.log("Cannot fetch parcels: user not logged in");
      return;
    }

    try {
      // Use different endpoints based on user role
      const endpoint = currentUser.role === UserRole.SUPER_ADMIN 
        ? '/shipment/list/' 
        : '/shipment/branch/list/';
      
      console.log("Fetching parcels from:", endpoint, "for user:", currentUser.role);
      const data = await api.get(endpoint);
      console.log("Parcels API response:", data);
      
      if (data.status === 200 && data.data) {
        // Backend now returns full fields in "list" field set
        const mapped: Parcel[] = data.data.map((s: any) => ({
          slug: s.slug,
          trackingId: s.tracking_id,
          senderName: s.sender_name,
          senderPhone: s.sender_phone,
          receiverName: s.receiver_name,
          receiverPhone: s.receiver_phone,
          // Backend returns nested branch objects: { slug, title }
          sourceOfficeId: s.source_branch?.slug || s.source_branch,
          destinationOfficeId: s.destination_branch?.slug || s.destination_branch,
          sourceOfficeTitle: s.source_branch?.title || '',
          destinationOfficeTitle: s.destination_branch?.title || '',
          description: s.description || '',
          paymentMode: s.payment_mode as PaymentMode,
          price: Number(s.price),
          currentStatus: s.current_status as ParcelStatus,
          bus: s.bus ? {
            slug: s.bus.slug,
            busNumber: s.bus.bus_number,
            preferredDays: s.bus.preferred_days || [],
            description: s.bus.description
          } : undefined,
          history: (s.history || []).map((h: any) => ({
            status: h.status as ParcelStatus,
            timestamp: new Date(h.created_at).getTime(),
            location: h.location,
            note: h.remarks || ''
          })),
          createdAt: s.created_at,
          day: s.day || s.created_at?.split('T')[0] // Use day field, fallback to created_at date
        }));
        console.log("Mapped parcels:", mapped);
        setParcels(mapped);
      } else {
        console.warn("Unexpected response status or missing data:", data);
        setParcels([]);
      }
    } catch (e: any) {
      console.error("Failed to fetch shipments:", e);
      setParcels([]);
    }
  }, [api, currentUser]);

  const createParcel = async (data: any) => {
    try {
      const resp = await api.post('/shipment/create/', {
        sender_name: data.senderName,
        sender_phone: data.senderPhone,
        receiver_name: data.receiverName,
        receiver_phone: data.receiverPhone,
        description: data.description,
        price: data.price,
        payment_mode: data.paymentMode,
        destination_branch_slug: data.destinationOfficeId, // Backend expects destination_branch_slug
        bus_slug: data.busSlug || null, // Include bus slug if provided
        day: data.day || null // Include day field if provided
      });

      if (resp.status === 201 && resp.data) {
        await fetchParcels();
        // Response now includes shipment and available_buses
        // resp.data is { shipment: {...}, available_buses: [...] }
        const responseData = resp.data;
        const s = responseData.shipment || responseData; // Handle both old and new format
        const availableBuses = responseData.available_buses || [];
        
        // Debug logging
        console.log("Shipment creation response:", resp);
        console.log("Response data:", responseData);
        console.log("Available buses from response:", availableBuses);
        const newParcel: Parcel = {
          slug: s.slug,
          trackingId: s.tracking_id,
          senderName: s.sender_name,
          senderPhone: s.sender_phone,
          receiverName: s.receiver_name,
          receiverPhone: s.receiver_phone,
          // Backend returns nested branch objects: { slug, title }
          sourceOfficeId: s.source_branch?.slug || s.source_branch,
          destinationOfficeId: s.destination_branch?.slug || s.destination_branch,
          sourceOfficeTitle: s.source_branch?.title || s.source_branch_title || '',
          destinationOfficeTitle: s.destination_branch?.title || s.destination_branch_title || '',
          description: s.description,
          paymentMode: s.payment_mode as PaymentMode,
          price: Number(s.price),
          currentStatus: s.current_status as ParcelStatus,
          bus: s.bus ? {
            slug: s.bus.slug,
            busNumber: s.bus.bus_number,
            preferredDays: s.bus.preferred_days || [],
            description: s.bus.description
          } : undefined,
          history: (s.history || []).map((h: any) => ({
            status: h.status as ParcelStatus,
            timestamp: new Date(h.created_at).getTime(),
            location: h.location,
            note: h.remarks
          })),
          createdAt: s.created_at,
          day: s.day || s.created_at?.split('T')[0] // Use day field, fallback to created_at date
        };

        // Send fake SMS notifications
        sendFakeSMS('Sender', data.senderPhone, `Your parcel to ${data.receiverName} is booked! Tracking ID: ${s.tracking_id}`);
        sendFakeSMS('Receiver', data.receiverPhone, `A parcel from ${data.senderName} has been booked. Tracking ID: ${s.tracking_id}`);
        
        // Map available buses to frontend format
        const mappedBuses = availableBuses.map((b: any) => ({
          slug: b.slug,
          busNumber: b.bus_number,
          preferredDays: b.preferred_days || [],
          description: b.description
        }));
        
        console.log("Mapped buses for frontend:", mappedBuses);
        
        return { 
          success: true, 
          message: 'Parcel booked successfully', 
          data: newParcel,
          availableBuses: mappedBuses
        };
      }
      return { success: false, message: resp.message || resp.error || 'Booking failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const updateParcelStatus = async (trackingId: string, newStatus: ParcelStatus, note: string = '') => {
    try {
      // Use authenticated API client instead of apiService function
      const resp = await api.patch(`/shipment/${trackingId}/update-status/`, {
        status: newStatus,
        remarks: note
      });
      if (resp.status === 200) {
        await fetchParcels();

        // SMS notifications (mock)
        const p = parcels.find(p => p.trackingId === trackingId);
        if (p) {
          if (newStatus === ParcelStatus.IN_TRANSIT) {
            sendFakeSMS('Receiver', p.receiverPhone, `Parcel ${trackingId} is now in transit.`);
          } else if (newStatus === ParcelStatus.ARRIVED) {
            sendFakeSMS('Receiver', p.receiverPhone, `Parcel ${trackingId} has arrived at destination.`);
          } else if (newStatus === ParcelStatus.DELIVERED) {
            sendFakeSMS('Sender', p.senderPhone, `Parcel ${trackingId} was delivered.`);
          }
        }

        return { success: true, message: 'Status updated' };
      }
      return { success: false, message: resp.message || 'Update failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      organization,
      offices,
      buses,
      parcels,
      notifications,
      loading,
      login,
      logout,
      addOffice,
      deleteOffice,
      fetchAdminBranches,
      addBus,
      deleteBus,
      fetchBuses,
      fetchParcels,
      createParcel,
      updateParcelStatus,
      trackShipment: async (id: string) => {
        try {
          // Public endpoint - use publicApi for unauthenticated access
          const publicApi = createApiClient();
          const res = await publicApi.get(`/shipment/track/${id}/`);
          if (res.status === 200 && res.data) {
             const s = res.data;
             return {
                success: true,
                data: {
                  slug: s.slug,
                  trackingId: s.tracking_id,
                  senderName: s.sender_name,
                  senderPhone: s.sender_phone,
                  receiverName: s.receiver_name,
                  receiverPhone: s.receiver_phone,
                  // Backend returns nested branch objects: { slug, title }
                  sourceOfficeId: s.source_branch?.slug || s.source_branch,
                  destinationOfficeId: s.destination_branch?.slug || s.destination_branch,
                  sourceOfficeTitle: s.source_branch?.title || s.source_branch_title || '',
                  destinationOfficeTitle: s.destination_branch?.title || s.destination_branch_title || '',
                  description: s.description,
                  paymentMode: s.payment_mode as PaymentMode,
                  price: Number(s.price),
                  currentStatus: s.current_status as ParcelStatus,
                  bus: s.bus ? {
                    slug: s.bus.slug,
                    busNumber: s.bus.bus_number,
                    preferredDays: s.bus.preferred_days || [],
                    description: s.bus.description
                  } : undefined,
                  history: (s.history || []).map((h: any) => ({
                    status: h.status as ParcelStatus,
                    timestamp: new Date(h.created_at).getTime(),
                    location: h.location,
                    note: h.remarks
                  })),
                  createdAt: s.created_at,
                  day: s.day || s.created_at?.split('T')[0] // Use day field, fallback to created_at date
                }
             };
          }
          return { success: false, message: res.message || 'Not found' };
        } catch (e: any) {
          return { success: false, message: e.message || 'Error occurred' };
        }
      },
      getShipmentDetails: async (id: string) => {
        try {
          const res = await api.get(`/shipment/${id}/`);
          if (res.status === 200 && res.data) {
             const s = res.data;
             return {
                success: true,
                data: {
                  slug: s.slug,
                  trackingId: s.tracking_id,
                  senderName: s.sender_name,
                  senderPhone: s.sender_phone,
                  receiverName: s.receiver_name,
                  receiverPhone: s.receiver_phone,
                  // Backend returns nested branch objects: { slug, title }
                  sourceOfficeId: s.source_branch?.slug || s.source_branch,
                  destinationOfficeId: s.destination_branch?.slug || s.destination_branch,
                  sourceOfficeTitle: s.source_branch?.title || s.source_branch_title || '',
                  destinationOfficeTitle: s.destination_branch?.title || s.destination_branch_title || '',
                  description: s.description,
                  paymentMode: s.payment_mode as PaymentMode,
                  price: Number(s.price),
                  currentStatus: s.current_status as ParcelStatus,
                  bus: s.bus ? {
                    slug: s.bus.slug,
                    busNumber: s.bus.bus_number,
                    preferredDays: s.bus.preferred_days || [],
                    description: s.bus.description
                  } : undefined,
                  history: (s.history || []).map((h: any) => ({
                    status: h.status as ParcelStatus,
                    timestamp: new Date(h.created_at).getTime(),
                    location: h.location,
                    note: h.remarks
                  })),
                  createdAt: s.created_at,
                  day: s.day || s.created_at?.split('T')[0] // Use day field, fallback to created_at date
                }
             };
          }
          return { success: false, message: res.message || 'Not found' };
        } catch (e: any) {
          return { success: false, message: e.message || 'Error occurred' };
        }
      },
      getOfficeName
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};