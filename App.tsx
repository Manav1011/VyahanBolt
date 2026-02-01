import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './views/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Offices } from './views/Offices';
import { Buses } from './views/Buses';
import { BookParcel } from './views/BookParcel';
import { ParcelList } from './views/ParcelList';
import { ShipmentDetails } from './views/ShipmentDetails';
import { Tracking } from './views/Tracking';
import { Analytics } from './views/Analytics';
import { OrganizationNotFound } from './views/OrganizationNotFound';
import { UserRole } from './types';


const TrackingPageWrapper = ({ currentUser }: { currentUser: any }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img src="/assets/logo.png" alt="Vyahan Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
          <span className="font-brand font-bold text-lg sm:text-xl text-slate-900 tracking-tight">Vyhan Tracking</span>
        </div>
        {!currentUser && (
          <button
            onClick={() => navigate('/')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F97316] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-[#EA580C] transition-all uppercase tracking-wider active:scale-95"
          >
            Login
          </button>
        )}
      </header>
      <main className="p-4 sm:p-6">
        <Tracking />
      </main>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, organization, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading Vyahan...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return <OrganizationNotFound />;
  }

  const location = useLocation();
  const isPublicTracking = location.pathname.startsWith('/track/');
  const isTrackingPage = location.pathname === '/tracking';

  // Allow direct access to tracking pages for everyone (even logged out) - check this FIRST
  if (isPublicTracking || isTrackingPage) {
      return (
        <Routes>
          <Route path="/track/:trackingId" element={<TrackingPageWrapper currentUser={currentUser} />} />
          <Route path="/tracking" element={<TrackingPageWrapper currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/tracking" replace />} />
        </Routes>
      );
  }

  // Require login for all other pages
  if (!currentUser) {
    return <Login />;
  }

  // If public user, show a simplified layout or just the view
  if (currentUser.role === UserRole.PUBLIC) {
    return (
      <Routes>
        <Route path="/tracking" element={
          <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2 font-bold text-xl text-indigo-900">
                <span>LogiTrack Public Portal</span>
              </div>
            </header>
            <main className="p-6">
              <Tracking />
            </main>
          </div>
        } />
        <Route path="*" element={<Navigate to="/tracking" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/offices" element={currentUser.role === UserRole.SUPER_ADMIN ? <Offices /> : <Navigate to="/dashboard" replace />} />
        <Route path="/buses" element={currentUser.role === UserRole.SUPER_ADMIN ? <Buses /> : <Navigate to="/dashboard" replace />} />
        <Route path="/book" element={currentUser.role === UserRole.OFFICE_ADMIN ? <BookParcel /> : <Navigate to="/dashboard" replace />} />
        <Route path="/shipments" element={<Navigate to="/analytics" replace />} />
        <Route path="/shipments/:trackingId" element={<ShipmentDetails />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;