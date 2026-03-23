import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentRegisterForm from '../../components/auth/StudentRegisterForm';
import OwnerRegisterForm from '../../components/auth/OwnerRegisterForm';
import ServiceProviderRegisterForm from '../../components/auth/ServiceProviderRegisterForm';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState('student');

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      const dashboardMap = {
        student: '/student/dashboard',
        owner: '/owner/dashboard',
        service_provider: '/provider/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dashboardMap[user.role] || '/');
    }
  }, [isAuthenticated, user, navigate]);

  const roles = [
    {
      id: 'student',
      name: 'Student',
      icon: '🎓',
      description: 'Find your ideal accommodation',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-600 to-cyan-600',
    },
    {
      id: 'owner',
      name: 'Property Owner',
      icon: '🏘️',
      description: 'List your properties',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-600 to-pink-600',
    },
    {
      id: 'service_provider',
      name: 'Service Provider',
      icon: '🔧',
      description: 'Offer maintenance services',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-600 to-red-600',
    },
  ];

  const handleRegistrationSuccess = () => {
    // Navigate to appropriate dashboard after successful registration
    const dashboardMap = {
      student: '/student/dashboard',
      owner: '/owner/dashboard',
      service_provider: '/provider/dashboard',
    };
    navigate(dashboardMap[selectedRole] || '/');
  };

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen relative overflow-hidden py-12 px-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-block p-3 bg-white/10 backdrop-blur-lg rounded-2xl mb-4">
            <span className="text-5xl">🏠</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Create Your Account</h1>
          <p className="text-blue-100 text-lg">Join the SLIIT Accommodation community today</p>
        </div>

        {/* Role Selector */}
        <div className="mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  selectedRole === role.id
                    ? 'border-white/50 bg-white/20 shadow-glow-md'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Background Gradient on Select */}
                {selectedRole === role.id && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-10 rounded-2xl`}></div>
                )}

                <div className="relative z-10">
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{role.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{role.name}</h3>
                  <p className="text-sm text-blue-100">{role.description}</p>
                </div>

                {/* Selected Indicator */}
                {selectedRole === role.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Registration Form Card */}
        <div className="backdrop-blur-xl bg-white/95 border border-white/20 rounded-3xl p-8 shadow-2xl animate-scale-in">
          {/* Form Header */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r ${selectedRoleData?.bgGradient} bg-clip-text text-transparent">
                  {selectedRoleData?.name} Registration
                </h2>
                <p className="text-gray-600 mt-1">Please fill in all required information</p>
              </div>
              <div className="text-5xl">{selectedRoleData?.icon}</div>
            </div>
          </div>

          {/* Form Container with Scroll */}
          <div className="max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
            {selectedRole === 'student' && (
              <div className="animate-fade-in">
                <StudentRegisterForm onSuccess={handleRegistrationSuccess} />
              </div>
            )}
            {selectedRole === 'owner' && (
              <div className="animate-fade-in">
                <OwnerRegisterForm onSuccess={handleRegistrationSuccess} />
              </div>
            )}
            {selectedRole === 'service_provider' && (
              <div className="animate-fade-in">
                <ServiceProviderRegisterForm onSuccess={handleRegistrationSuccess} />
              </div>
            )}
          </div>

          {/* Sign In Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className={`font-semibold bg-gradient-to-r ${selectedRoleData?.bgGradient} bg-clip-text text-transparent hover:underline`}>
                Sign In →
              </Link>
            </p>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 backdrop-blur-xl bg-white/90 border border-white/20 rounded-2xl p-6 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <span className="mr-2 text-2xl">📋</span>
            Registration Information
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 text-white text-xs">✓</span>
              <span>
                <strong className="text-gray-900">Students:</strong> Use your SLIIT email (@my.sliit.lk) to register
              </span>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 text-white text-xs">✓</span>
              <span>
                <strong className="text-gray-900">Property Owners:</strong> Your account will be verified after registration
              </span>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 text-white text-xs">✓</span>
              <span>
                <strong className="text-gray-900">Service Providers:</strong> Admin approval required before accessing the platform
              </span>
            </li>
            <li className="flex items-start group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3 text-white text-xs">🔒</span>
              <span>All your personal information is <strong className="text-gray-900">encrypted and kept secure</strong></span>
            </li>
          </ul>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Link to="/" className="inline-flex items-center text-white hover:text-blue-200 transition-colors font-medium">
            <span className="mr-2">←</span> Back to Home
          </Link>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
