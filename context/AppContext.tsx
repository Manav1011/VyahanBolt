import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Office, Parcel, ParcelStatus, TrackingEvent, UserRole, NotificationLog, PaymentMode } from '../types';
import { fetchHealth, fetchBranches, loginOrganization, loginBranch, logoutUser, createApiClient, fetchShipments, createShipment, updateShipmentStatus as apiUpdateStatus } from '../services/apiService';
import { jwtDecode } from 'jwt-decode';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';



interface AppContextType {
  currentUser: User | null;
  organization: any | null;
  offices: Office[];
  parcels: Parcel[];
  notifications: NotificationLog[];
  loading: boolean;
  login: (role: UserRole, credentials: { id?: string, password?: string }) => Promise<{ success: boolean, message: string }>;
  logout: () => Promise<void>;
  addOffice: (officeData: { name: string, password?: string }) => Promise<{ success: boolean, message: string }>;
  deleteOffice: (officeId: string) => Promise<{ success: boolean, message: string }>;
  fetchAdminBranches: () => Promise<void>;
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
        const healthData = await initApi.get('/organization/health/');
        if (healthData.status_code === 200) {
          setOrganization(healthData.data);

          let mappedOffices: Office[] = [];
          // Use bundled branches from health check
          if (healthData.data.branches) {
            mappedOffices = healthData.data.branches.map((b: any) => ({
              id: b.slug,
              name: b.title
            }));
            setOffices(mappedOffices);
          }

          // Check if we have a saved token and restore session
          const access = localStorage.getItem('access_token');
          if (access) {
            try {
              const decoded: any = jwtDecode(access);
              const currentTime = Date.now() / 1000;
              if (decoded.exp > currentTime) {
                const user: User = {
                  id: decoded.sub_id,
                  name: decoded.sub_type === 'org'
                    ? healthData.data.title
                    : mappedOffices.find((o: any) => o.id === decoded.sub_id)?.name || 'Branch Manager',
                  role: decoded.sub_type === 'org' ? UserRole.SUPER_ADMIN : UserRole.OFFICE_ADMIN,
                  officeId: decoded.sub_type === 'branch' ? decoded.sub_id : undefined
                };
                setCurrentUser(user);

                // If admin, also fetch the full branch details
                if (user.role === UserRole.SUPER_ADMIN) {
                  const adminApi = createApiClient(); // Use local since api useMemo might not be ready in exact same tick
                  const adminBranches = await adminApi.get('/organization/branches/admin/');
                  if (adminBranches.status_code === 200) {
                    const mapped = adminBranches.data.branches.map((b: any) => ({
                      id: b.slug,
                      name: b.title
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

    initializeApp().then(() => {
      if (localStorage.getItem('access_token')) {
        fetchParcels();
      }
    });
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
        data = await loginOrganization(organization?.slug, credentials.password || '');
      } else if (role === UserRole.OFFICE_ADMIN) {
        data = await loginBranch(credentials.id || '', credentials.password || '');
      } else {
        // Public/Tracking - stays mock/session-less for now
        setCurrentUser({ id: 'public', name: 'Guest', role: UserRole.PUBLIC });
        return { success: true, message: 'Logged in as guest' };
      }

      if (data.status_code === 200) {
        const { access, refresh } = data.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        const decoded: any = jwtDecode(access);
        const name = role === UserRole.SUPER_ADMIN
          ? data.data.organization.title
          : data.data.branch.title;

        const user: User = {
          id: decoded.sub_id,
          name: name,
          role: role,
          officeId: role === UserRole.OFFICE_ADMIN ? decoded.sub_id : undefined
        };

        setCurrentUser(user);

        // If admin, refetch branches to get full details
        if (role === UserRole.SUPER_ADMIN) {
          await fetchAdminBranches();
        }

        await fetchParcels();

        return { success: true, message: data.message };
      }
      else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, message: error.message || 'An error occurred during login' };
    }
  };

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await logoutUser(refresh);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    navigate('/');
  }, [navigate]);

  const fetchAdminBranches = useCallback(async () => {
    try {
      const data = await api.get('/organization/branches/admin/');
      if (data.status_code === 200) {
        const mapped = data.data.branches.map((b: any) => ({
          id: b.slug,
          name: b.title
        }));
        setOffices(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch admin branches:", e);
    }
  }, [api]);

  const addOffice = async (officeData: { name: string, password?: string }) => {
    try {
      const data = await api.post('/organization/branches/admin/create/', {
        title: officeData.name,
        password: officeData.password || 'default_branch_pass'
      });

      if (data.status_code === 201) {
        await fetchAdminBranches(); // Refresh the list
        return { success: true, message: 'Office created' };
      }
      return { success: false, message: data.message || 'Creation failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const deleteOffice = async (officeId: string) => {
    try {
      const data = await api.delete(`/organization/branches/admin/${officeId}/delete/`);
      if (data.status_code === 200) {
        await fetchAdminBranches();
        return { success: true, message: 'Office deleted' };
      }
      return { success: false, message: data.message || 'Deletion failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const getOfficeName = (id: string) => offices.find(o => o.id === id)?.name || 'Unknown Office';

  const fetchParcels = useCallback(async () => {
    try {
      const data = await api.get('/shipment/list/');
      if (data.status_code === 200) {
        const mapped: Parcel[] = data.data.map((s: any) => ({
          slug: s.slug,
          trackingId: s.tracking_id,
          senderName: s.sender_name,
          senderPhone: s.sender_phone,
          receiverName: s.receiver_name,
          receiverPhone: s.receiver_phone,
          sourceOfficeId: s.source_branch,
          destinationOfficeId: s.destination_branch,
          sourceOfficeTitle: s.source_branch_title,
          destinationOfficeTitle: s.destination_branch_title,
          description: s.description,
          paymentMode: s.payment_mode as PaymentMode,
          price: Number(s.price),
          currentStatus: s.current_status as ParcelStatus,
          history: s.history.map((h: any) => ({
            status: h.status as ParcelStatus,
            timestamp: new Date(h.created_at).getTime(),
            location: h.location,
            note: h.remarks
          })),
          createdAt: s.created_at
        }));
        setParcels(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch shipments:", e);
    }
  }, [api]);

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
        destination_branch: data.destinationOfficeId
      });

      if (resp.status_code === 201) {
        await fetchParcels();
        const newParcel: Parcel = {
          slug: resp.data.slug,
          trackingId: resp.data.tracking_id,
          senderName: resp.data.sender_name,
          senderPhone: resp.data.sender_phone,
          receiverName: resp.data.receiver_name,
          receiverPhone: resp.data.receiver_phone,
          sourceOfficeId: resp.data.source_branch,
          destinationOfficeId: resp.data.destination_branch,
          sourceOfficeTitle: resp.data.source_branch_title,
          destinationOfficeTitle: resp.data.destination_branch_title,
          description: resp.data.description,
          paymentMode: resp.data.payment_mode as PaymentMode,
          price: Number(resp.data.price),
          currentStatus: resp.data.current_status as ParcelStatus,
          history: resp.data.history.map((h: any) => ({
            status: h.status as ParcelStatus,
            timestamp: new Date(h.created_at).getTime(),
            location: h.location,
            note: h.remarks
          })),
          createdAt: resp.data.created_at
        };

        // Send fake SMS notifications
        sendFakeSMS('Sender', data.senderPhone, `Your parcel to ${data.receiverName} is booked! Tracking ID: ${resp.data.tracking_id}`);
        sendFakeSMS('Receiver', data.receiverPhone, `A parcel from ${data.senderName} has been booked. Tracking ID: ${resp.data.tracking_id}`);
        return { success: true, message: 'Parcel booked successfully', data: newParcel };
      }
      return { success: false, message: resp.message || 'Booking failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error occurred' };
    }
  };

  const updateParcelStatus = async (trackingId: string, newStatus: ParcelStatus, note: string = '') => {
    try {
      const resp = await apiUpdateStatus(trackingId, newStatus, note);
      if (resp.status_code === 200) {
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
      parcels,
      notifications,
      loading,
      login,
      logout,
      addOffice,
      deleteOffice,
      fetchAdminBranches,
      fetchParcels,
      createParcel,
      updateParcelStatus,
      trackShipment: async (id: string) => {
        try {
          const res = await api.get(`/shipment/track/${id}/`);
          if (res.status_code === 200) {
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
                  sourceOfficeId: s.source_branch,
                  destinationOfficeId: s.destination_branch,
                  sourceOfficeTitle: s.source_branch_title,
                  destinationOfficeTitle: s.destination_branch_title,
                  description: s.description,
                  paymentMode: s.payment_mode as PaymentMode,
                  price: Number(s.price),
                  currentStatus: s.current_status as ParcelStatus,
                  history: s.history.map((h: any) => ({
                    status: h.status as ParcelStatus,
                    timestamp: new Date(h.created_at).getTime(),
                    location: h.location,
                    note: h.remarks
                  })),
                  createdAt: s.created_at
                }
             };
          }
          return { success: false, message: 'Not found' };
        } catch (e) {
          return { success: false, message: 'Error' };
        }
      },
      getShipmentDetails: async (id: string) => {
        try {
          // Use the authenticated client 'api' here, not 'publicApi' usage implied by calling service directly? 
          // Wait, apiService functions use 'publicApi' which is a stateless client.
          // Yet 'createApiClient' is what AppContext uses for 'api'.
          // The functions in apiService.ts like 'fetchShipments' use 'publicApi'.
          // But 'publicApi' in apiService.ts is just a fresh client, it doesn't hold token automatically unless we passed it?
          // Actually, createApiClient inside apiService.ts pulls from localStorage. So 'publicApi' works if token is in storage.
          // However, AppContext has its own 'api' instance that handles auto-logout.
          // We should ideally use 'api.get' here to ensure 401 handling works.
          
          const res = await api.get(`/shipment/${id}/`);
          if (res.status_code === 200) {
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
                  sourceOfficeId: s.source_branch,
                  destinationOfficeId: s.destination_branch,
                  sourceOfficeTitle: s.source_branch_title,
                  destinationOfficeTitle: s.destination_branch_title,
                  description: s.description,
                  paymentMode: s.payment_mode as PaymentMode,
                  price: Number(s.price),
                  currentStatus: s.current_status as ParcelStatus,
                  history: s.history.map((h: any) => ({
                    status: h.status as ParcelStatus,
                    timestamp: new Date(h.created_at).getTime(),
                    location: h.location,
                    note: h.remarks
                  })),
                  createdAt: s.created_at
                }
             };
          }
          return { success: false, message: 'Not found' };
        } catch (e) {
          return { success: false, message: 'Error' };
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