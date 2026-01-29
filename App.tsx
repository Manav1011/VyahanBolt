import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { OrganizationNotFound } from './views/OrganizationNotFound';
import { UserRole } from './types';


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

  if (!currentUser && !isPublicTracking) {
    return <Login />;
  }

  // Allow direct access to tracking page for everyone (even logged out)
  if (isPublicTracking) {
      return (
        <Routes>
          <Route path="/track/:trackingId" element={
            <div className="min-h-screen bg-slate-50">
              <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2 font-bold text-xl text-indigo-900">
                  <span className="font-brand text-slate-900">Vyhan Tracking</span>
                </div>
              </header>
              <main className="p-6">
                <Tracking />
              </main>
            </div>
          } />
        </Routes>
      );
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
        <Route path="/shipments" element={<ParcelList />} />
        <Route path="/shipments/:trackingId" element={<ShipmentDetails />} />
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