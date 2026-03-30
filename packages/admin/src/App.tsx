import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { ClassesPage } from './pages/ClassesPage';
import { BadgesPage } from './pages/BadgesPage';
import { QuestsPage } from './pages/QuestsPage';
import { JournalFeedPage } from './pages/JournalFeedPage';
import { ChannelsPage } from './pages/ChannelsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen bg-charcoal"><div className="text-warm-accent text-xl">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="quests" element={<QuestsPage />} />
        <Route path="journal-feed" element={<JournalFeedPage />} />
        <Route path="channels" element={<ChannelsPage />} />
      </Route>
    </Routes>
  );
}
