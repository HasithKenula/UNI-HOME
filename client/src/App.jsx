import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import SearchPage from './pages/public/SearchPage';
import ListingDetailPage from './pages/public/ListingDetailPage';
import CreateListingPage from './pages/owner/CreateListingPage';
import EditListingPage from './pages/owner/EditListingPage';
import MyListingsPage from './pages/owner/MyListingsPage';
import TenantManagementPage from './pages/owner/TenantManagementPage';
import OwnerTicketsPage from './pages/owner/OwnerTicketsPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import MyTasksPage from './pages/provider/MyTasksPage';
import MyTicketsPage from './pages/student/MyTicketsPage';
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

          {/* Protected Routes - To be implemented in future phases */}
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Student Dashboard</h1>
                  <p className="text-gray-600 mt-4">
                    This page will be implemented in the next phase.
                  </p>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['owner', 'admin']}>
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold">Owner Dashboard</h1>
                    <p className="text-gray-600 mt-4">
                      Use the pages below to manage your listings.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a className="text-blue-600 font-semibold" href="/owner/my-listings">My Listings</a>
                      <a className="text-blue-600 font-semibold" href="/owner/listings/create">Create Listing</a>
                      <a className="text-blue-600 font-semibold" href="/owner/tenants">Tenant Management</a>
                      <a className="text-blue-600 font-semibold" href="/owner/tickets">Owner Tickets</a>
                    </div>
                  </div>
                </RoleRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/student/tickets"
            element={
              <PrivateRoute>
                <RoleRoute allowedRoles={['student', 'admin']}>
                  <MyTicketsPage />
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
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-gray-600 mt-4">
                    This page will be implemented in the next phase.
                  </p>
                </div>
              </PrivateRoute>
            }
          />

          {/* Placeholder Routes */}
          <Route
            path="/about"
            element={
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">About Us</h1>
                <p className="text-gray-600 mt-4">
                  Learn more about SLIIT Accommodation System.
                </p>
              </div>
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
