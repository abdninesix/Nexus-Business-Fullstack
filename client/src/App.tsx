import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Modal from 'react-modal';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EntrepreneurDashboard } from './pages/dashboard/EntrepreneurDashboard';
import { InvestorDashboard } from './pages/dashboard/InvestorDashboard';

// Profile Pages
import { ProfilePage } from './pages/profile/ProfilePage';
import { EntrepreneurProfile } from './pages/profile/EntrepreneurProfile';
import { InvestorProfile } from './pages/profile/InvestorProfile';

// Feature Pages
import { InvestorsPage } from './pages/investors/InvestorsPage';
import { EntrepreneursPage } from './pages/entrepreneurs/EntrepreneursPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { DealsPage } from './pages/deals/DealsPage';
import { EntrepreneurDealsPage } from './pages/deals/EntrepreneurDealsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';

// Chat Pages
import { MessagesPage } from './pages/messages/MessagesPage';
import { ChatPage } from './pages/chat/ChatPage';
import { VideoCallPage } from './pages/call/VideoCallPage';
import { CallLobby } from './pages/call/CallLobby';
import { TransactionsPage } from './pages/deals/TransactionsPage';
import { SocketProvider } from './context/SocketContext';

Modal.setAppElement('#root');

const DealsRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'entrepreneur') return <EntrepreneurDealsPage />;
  if (user?.role === 'investor') return <DealsPage />;
  return null; // Or a fallback
};

function App() {
  return (
    <AuthProvider>
      <Router>

        <SocketProvider>
          <Toaster />

          <Routes>
            {/* Authentication Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="entrepreneur" element={<EntrepreneurDashboard />} />
                <Route path="investor" element={<InvestorDashboard />} />
              </Route>

              {/* Profile Routes */}
              <Route path="/profile" element={<DashboardLayout />}>
                <Route index element={<ProfilePage />} />
                <Route path="entrepreneur/:id" element={<EntrepreneurProfile />} />
                <Route path="investor/:id" element={<InvestorProfile />} />
              </Route>

              {/* Feature Routes */}
              <Route path="/investors" element={<DashboardLayout />}>
                <Route index element={<InvestorsPage />} />
              </Route>

              <Route path="/entrepreneurs" element={<DashboardLayout />}>
                <Route index element={<EntrepreneursPage />} />
              </Route>

              <Route path="/messages" element={<DashboardLayout />}>
                <Route index element={<MessagesPage />} />
              </Route>

              <Route path="/notifications" element={<DashboardLayout />}>
                <Route index element={<NotificationsPage />} />
              </Route>

              <Route path="/documents" element={<DashboardLayout />}>
                <Route index element={<DocumentsPage />} />
              </Route>

              <Route path="/settings" element={<DashboardLayout />}>
                <Route index element={<SettingsPage />} />
              </Route>

              <Route path="/help" element={<DashboardLayout />}>
                <Route index element={<HelpPage />} />
              </Route>

              <Route path="/deals" element={<DashboardLayout />}>
                <Route index element={<DealsRedirect />} />
              </Route>

              <Route path="/transactions" element={<DashboardLayout />}>
                <Route index element={<TransactionsPage />} />
              </Route>

              <Route path="/calendar" element={<DashboardLayout />}>
                <Route index element={<CalendarPage />} />
              </Route>

              <Route path="/lobby" element={<DashboardLayout />}>
                <Route path=":meetingId" element={<CallLobby />} />
              </Route>

              <Route path="/call/:meetingId" element={<VideoCallPage />} />

              {/* Chat Routes */}
              <Route path="/chat" element={<DashboardLayout />}>
                <Route index element={<ChatPage />} />
                <Route path=":userId" element={<ChatPage />} />
              </Route>

              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

        </SocketProvider>

      </Router>
    </AuthProvider >
  );
}

export default App;