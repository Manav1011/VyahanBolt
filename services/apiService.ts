import { jwtDecode } from 'jwt-decode';

export const API_BASE_URL = '/api';

interface ApiRequestOptions extends RequestInit {
    body?: any;
}

export const createApiClient = (onUnauthorized?: () => void) => {
    const getAccessToken = async () => {
        let token = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');

        if (!token || !refresh) return null;

        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // If token is expired or expires in less than 30 seconds, refresh it
            if (decoded.exp < currentTime + 30) {
                const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access: token, refresh })
                });

                const refreshResponse = await response.json();
                // Backend returns: { message, data: { access, refresh }, error }
                if (response.status === 200 && refreshResponse.data) {
                    token = refreshResponse.data.access;
                    localStorage.setItem('access_token', token);
                    if (refreshResponse.data.refresh) {
                        localStorage.setItem('refresh_token', refreshResponse.data.refresh);
                    }
                } else {
                    if (onUnauthorized) onUnauthorized();
                    return null;
                }
            }
        } catch (e) {
            console.error("Token refresh failed:", e);
            if (onUnauthorized) onUnauthorized();
            return null;
        }

        return token;
    };

    const request = async (endpoint: string, options: ApiRequestOptions = {}) => {
        const token = await getAccessToken();

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (response.status === 401) {
            if (onUnauthorized) onUnauthorized();
            throw new Error('Session expired');
        }

        // Return data with HTTP status code for compatibility
        // Backend returns: { message, data, error }
        // We add status field for easier checking
        return {
            ...data,
            status: response.status,
            status_code: response.status // Keep for backward compatibility
        };
    };

    return {
        get: (endpoint: string, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'GET' }),
        post: (endpoint: string, body: any, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
        put: (endpoint: string, body: any, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
        patch: (endpoint: string, body: any, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
        delete: (endpoint: string, options?: ApiRequestOptions) => request(endpoint, { ...options, method: 'DELETE' }),
    };
};

// Stateless client for initial/public calls
const publicApi = createApiClient();

export const fetchHealth = () => publicApi.get('/organization/info/');

export const loginOrganization = async (username: string, password: string) => {
    return publicApi.post('/auth/token', { 
        login_type: 'organization',
        username,
        password 
    });
};

export const loginBranch = async (username: string, password: string) => {
    return publicApi.post('/auth/token', { 
        login_type: 'branch',
        username,
        password 
    });
};

export const logoutUser = async () => {
    // Logout endpoint doesn't need body, uses token from Authorization header
    const api = createApiClient();
    return api.post('/auth/logout', {});
};

export const fetchBranches = () => publicApi.get('/organization/branches/');

// Shipment APIs
export const createShipment = (data: any) => publicApi.post('/shipment/create/', data);
export const fetchShipments = () => publicApi.get('/shipment/list/');
export const getShipment = (trackingId: string) => publicApi.get(`/shipment/${trackingId}/`);
export const updateShipmentStatus = (trackingId: string, status: string, remarks: string) =>
    publicApi.patch(`/shipment/${trackingId}/update-status/`, { status, remarks });
export const trackShipment = (trackingId: string) => publicApi.get(`/shipment/track/${trackingId}/`);

// Analytics APIs
export const getOrganizationAnalytics = (filters: any) => {
    const api = createApiClient();
    return api.post('/analytics/organization/', filters);
};

export const getBranchAnalytics = (filters: any) => {
    const api = createApiClient();
    return api.post('/analytics/branch/', filters);
};

// Messaging APIs
export const fetchMessages = () => {
    const api = createApiClient();
    return api.get('/messages/');
};

export const markMessageAsRead = (messageId: number) => {
    const api = createApiClient();
    return api.patch(`/messages/${messageId}/read/`, {});
};
