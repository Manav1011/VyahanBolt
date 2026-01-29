import { useApp } from '../context/AppContext';
import { createApiClient } from '../services/apiService';

export const useApi = () => {
    const { logout } = useApp();
    return createApiClient(logout);
};
