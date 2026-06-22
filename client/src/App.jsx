import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import Landing from './pages/Landing.jsx';
import Features from './pages/Features.jsx';
import Pricing from './pages/Pricing.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Calendar from './pages/Calendar.jsx';
import Fields from './pages/Fields.jsx';
import Seasons from './pages/Seasons.jsx';
import SeasonForm from './pages/SeasonForm.jsx';
import Income from './pages/Income.jsx';
import Inventory from './pages/Inventory.jsx';
import Analytics from './pages/Analytics.jsx';
import Report from './pages/Report.jsx';
import Admin from './pages/Admin.jsx';
import Register from './pages/Register.jsx';
import Verify from './pages/Verify.jsx';
import Assets from './pages/Assets.jsx';
import SoilAnalysis from './pages/SoilAnalysis.jsx';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/seasons/new" element={<SeasonForm />} />
        <Route path="/seasons/:id/edit" element={<SeasonForm />} />
        <Route path="/income" element={<Income />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/soil-analysis" element={<SoilAnalysis />} />
        <Route path="/report" element={<Report />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute adminOnly>
              <Admin />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
