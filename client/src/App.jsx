import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PrivateRoute from './routes/PrivateRoute';

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
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Owner Dashboard</h1>
                  <p className="text-gray-600 mt-4">
                    This page will be implemented in the next phase.
                  </p>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/provider/dashboard"
            element={
              <PrivateRoute>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Service Provider Dashboard</h1>
                  <p className="text-gray-600 mt-4">
                    This page will be implemented in the next phase.
                  </p>
                </div>
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
            path="/search"
            element={
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold">Search Accommodations</h1>
                <p className="text-gray-600 mt-4">This page will be implemented in Phase 2.</p>
              </div>
            }
          />
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
