import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutAsync } from '../../features/auth/authSlice';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import Button from './Button';
import NotificationBell from '../notification/NotificationBell';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items: notifications, unreadCount, loading: notificationsLoading } = useNotifications({
    limit: 10,
    pollMs: 30000,
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logoutAsync());
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'student':
        return '/student/dashboard';
      case 'owner':
        return '/owner/dashboard';
      case 'service_provider':
        return '/provider/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-emerald-50/90 border-b border-emerald-100 shadow-sm'
          : 'bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100/70 shadow-sm border-b border-emerald-100/80'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/branding/unihome-logo.png"
              alt="UNIHOME logo"
              className="h-9 w-9 rounded-md object-cover transform group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              UNIHOME
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`relative font-medium transition-colors duration-300 ${
                isActive('/') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              } group`}
            >
              Home
              <span
                className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left transition-transform duration-300 ${
                  isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></span>
            </Link>
            <Link
              to="/search"
              className={`relative font-medium transition-colors duration-300 ${
                isActive('/search') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              } group`}
            >
              Accommodations
              <span
                className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left transition-transform duration-300 ${
                  isActive('/search') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></span>
            </Link>
            <Link
              to="/about"
              className={`relative font-medium transition-colors duration-300 ${
                isActive('/about') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              } group`}
            >
              About
              <span
                className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left transition-transform duration-300 ${
                  isActive('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></span>
            </Link>
            <Link
              to="/contact"
              className={`relative font-medium transition-colors duration-300 ${
                isActive('/contact') ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'
              } group`}
            >
              Contact
              <span
                className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left transition-transform duration-300 ${
                  isActive('/contact') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              ></span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="relative font-medium text-slate-700 hover:text-emerald-700 transition-colors group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <div className="flex items-center space-x-4 pl-4 border-l border-emerald-200">
                  <NotificationBell
                    notifications={notifications}
                    unreadCount={unreadCount}
                    loading={notificationsLoading}
                  />
                  <div className="flex items-center space-x-2 bg-white/70 px-3 py-2 rounded-lg border border-emerald-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-semibold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {user?.firstName || 'User'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 pl-4 border-l border-emerald-200">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-emerald-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu with Smooth Animation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col space-y-2 border-t border-emerald-100 pt-4">
            <Link
              to="/"
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-emerald-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive('/search')
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-emerald-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/about"
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive('/about')
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-emerald-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive('/contact')
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-emerald-50'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="px-4 py-3 rounded-xl font-medium text-slate-700 hover:bg-emerald-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="pt-3 border-t mt-3 border-emerald-100">
                  <div className="flex items-center space-x-3 px-4 py-2 mb-3 bg-white/80 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.firstName || 'User'}
                      </p>
                      <p className="text-xs text-slate-600">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-3 border-t mt-3 space-y-2 border-emerald-100">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" fullWidth>
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
