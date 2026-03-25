import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import SearchPage from './pages/public/SearchPage';
import ListingDetailPage from './pages/public/ListingDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import CreateListingPage from './pages/owner/CreateListingPage';
import EditListingPage from './pages/owner/EditListingPage';
import MyListingsPage from './pages/owner/MyListingsPage';
import TenantManagementPage from './pages/owner/TenantManagementPage';
import BookingRequestsPage from './pages/owner/BookingRequestsPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ServiceProviderCategoriesPage from './pages/owner/ServiceProviderCategoriesPage';
import ServiceProvidersPage from './pages/owner/ServiceProvidersPage';
import MyBookingsPage from './pages/student/MyBookingsPage';
import FavoritesPage from './pages/student/FavoritesPage';
import BookingDetailPage from './pages/student/BookingDetailPage';
import InquiriesPage from './pages/student/InquiriesPage';
import StudentDashboard from './pages/student/StudentDashboard';
import MyTicketsPage from './pages/student/MyTicketsPage';
import TicketDetailPage from './pages/student/TicketDetailPage';
import OwnerTicketsPage from './pages/owner/OwnerTicketsPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';
import MyTasksPage from './pages/provider/MyTasksPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import ListingModerationPage from './pages/admin/ListingModerationPage';
import ReportsPage from './pages/admin/ReportsPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import TicketEscalationsPage from './pages/admin/TicketEscalationsPage';
import NotificationConsolePage from './pages/admin/NotificationConsolePage';
import AuditLogPage from './pages/admin/AuditLogPage';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected Routes - To be implemented in future phases */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <OwnerDashboard />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/my-listings"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <MyListingsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/listings/create"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <CreateListingPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/listings/:id/edit"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <EditListingPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/tenants"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <TenantManagementPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/booking-requests"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <BookingRequestsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/service-categories"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <ServiceProviderCategoriesPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/service-providers"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <ServiceProvidersPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/service-providers/:category"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <ServiceProvidersPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/bookings"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student']}>
                  <MyBookingsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/bookings/:id"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student', 'owner', 'admin']}>
                  <BookingDetailPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/favorites"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student']}>
                  <FavoritesPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/inquiries"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student', 'owner']}>
                  <InquiriesPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/tickets"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student']}>
                  <MyTicketsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/tickets/:id"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student', 'owner', 'service_provider', 'admin']}>
                  <TicketDetailPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/tickets"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <OwnerTicketsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/provider/dashboard"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['service_provider', 'admin']}>
                  <ProviderDashboard />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['service_provider', 'admin']}>
                  <ProviderProfilePage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/provider/tasks"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['service_provider', 'admin']}>
                  <MyTasksPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <UserManagementPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/listings"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <ListingModerationPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <ReportsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <TransactionsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/ticket-escalations"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <TicketEscalationsPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <NotificationConsolePage />
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AuditLogPage />
                </RoleRoute>
              </PrivateRoute>
            }
          />

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <a href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Go back home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
