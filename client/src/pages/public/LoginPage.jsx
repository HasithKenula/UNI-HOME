import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAsync } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      const dashboardMap = {
        student: '/student/dashboard',
        owner: '/owner/dashboard',
        service_provider: '/provider/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dashboardMap[user.role] || from);
    }
  }, [isAuthenticated, user, navigate, from]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(loginAsync(formData));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
            <span className="text-6xl">🏠</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Welcome Back</h1>
          <p className="text-blue-100 text-lg">Sign in to your account to continue</p>
        </div>

        {/* Glass Morphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              required
              className="bg-white/90 backdrop-blur-sm"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              required
              className="bg-white/90 backdrop-blur-sm"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-white/30 bg-white/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                />
                <span className="ml-2 text-sm text-white group-hover:text-blue-100 transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-blue-100 hover:text-white transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-glow-md hover:shadow-glow-lg transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              {loading ? 'Signing In...' : 'Sign In →'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/10 text-white rounded-full">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-white">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-200 hover:text-white font-semibold transition-colors underline decoration-2 underline-offset-4">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
            <p className="text-sm font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">🔑</span> Demo Credentials
            </p>
            <div className="text-xs text-blue-100 space-y-2 font-mono">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <span>Student:</span>
                <span className="text-white">john@my.sliit.lk</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <span>Owner:</span>
                <span className="text-white">michael@gmail.com</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <span>Provider:</span>
                <span className="text-white">david@gmail.com</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg text-center text-blue-200">
                Password: <span className="text-white font-semibold">Password123!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/" className="inline-flex items-center text-white hover:text-blue-200 transition-colors font-medium">
            <span className="mr-2">←</span> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
