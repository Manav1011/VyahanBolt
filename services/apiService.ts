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
                const response = await fetch(`${API_BASE_URL}/organization/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh })
                });

                const data = await response.json();
                if (data.status_code === 200) {
                    token = data.data.access;
                    localStorage.setItem('access_token', token);
                    if (data.data.refresh) {
                        localStorage.setItem('refresh_token', data.data.refresh);
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

        return data;
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

export const fetchHealth = () => publicApi.get('/organization/health/');

export const loginOrganization = async (org_id: string, password: string) => {
    return publicApi.post('/organization/login/', { org_id, password });
};

export const loginBranch = async (branch_id: string, password: string) => {
    return publicApi.post('/organization/branch/login/', { branch_id, password });
};

export const logoutUser = async (refresh: string) => {
    return publicApi.post('/organization/logout/', { refresh });
};

export const fetchBranches = () => publicApi.get('/organization/branches/');

// Shipment APIs
export const createShipment = (data: any) => publicApi.post('/shipment/create/', data);
export const fetchShipments = () => publicApi.get('/shipment/list/');
export const getShipment = (trackingId: string) => publicApi.get(`/shipment/${trackingId}/`);
export const updateShipmentStatus = (trackingId: string, status: string, remarks: string) =>
    publicApi.patch(`/shipment/${trackingId}/update-status/`, { status, remarks });
export const trackShipment = (trackingId: string) => publicApi.get(`/shipment/track/${trackingId}/`);
