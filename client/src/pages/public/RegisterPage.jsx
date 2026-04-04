import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded';
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
      icon: <SchoolRoundedIcon fontSize="small" />,
      description: 'Find your ideal accommodation',
      accent: '#10B981',
    },
    {
      id: 'owner',
      name: 'Property Owner',
      icon: <ApartmentRoundedIcon fontSize="small" />,
      description: 'List your properties',
      accent: '#14B8A6',
    },
    {
      id: 'service_provider',
      name: 'Service Provider',
      icon: <BuildCircleRoundedIcon fontSize="small" />,
      description: 'Offer maintenance services',
      accent: '#047857',
    },
  ];

  const handleRegistrationSuccess = (user) => {
    // Auto-redirect based on role
    const dashboardMap = {
      student: '/student/dashboard',
      owner: '/owner/dashboard',
      service_provider: '/provider/dashboard',
      admin: '/admin/dashboard',
    };
    navigate(dashboardMap[user.role] || '/');
  };

  const selectedRoleData = roles.find((r) => r.id === selectedRole);
  const handleRoleChange = (_, nextRole) => {
    if (nextRole) {
      setSelectedRole(nextRole);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-secondary px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.15),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(20,184,166,0.18),transparent_45%),linear-gradient(135deg,#ecfdf5,#fafafa_45%,#f0fdfa)]" />
      <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <Paper elevation={0} className="rounded-3xl border border-primary-100 bg-white/95 p-6 shadow-xl md:p-8">
          <Stack spacing={3}>
            <Box className="text-center">
              <Typography variant="h4" fontWeight={700} sx={{ color: '#374151' }}>
                Create Your Account
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280' }} className="mt-1">
                Choose your account type and complete the registration form
              </Typography>
            </Box>

            <ToggleButtonGroup
              color="primary"
              value={selectedRole}
              exclusive
              onChange={handleRoleChange}
              fullWidth
              className="flex-wrap"
              sx={{
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: '12px !important',
                  border: '1px solid #d1fae5',
                  margin: '4px',
                  textTransform: 'none',
                  fontWeight: 600,
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  borderColor: '#6ee7b7',
                },
              }}
            >
              {roles.map((role) => (
                <ToggleButton key={role.id} value={role.id}>
                  <Box className="flex items-center gap-2 px-2 py-1">
                    {role.icon}
                    <span>{role.name}</span>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Box className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/60 to-accent-50/40 p-4 md:p-5">
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} className="mb-4">
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: selectedRoleData?.accent }}>
                    {selectedRoleData?.name} Registration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRoleData?.description}
                  </Typography>
                </Box>
                <Chip
                  label="Secure onboarding"
                  variant="outlined"
                  sx={{ borderColor: '#99f6e4', color: '#0f766e', bgcolor: '#f0fdfa', fontWeight: 700 }}
                />
              </Stack>

              <div className="max-h-[60vh] overflow-y-auto pr-1">
                {selectedRole === 'student' && <StudentRegisterForm onSuccess={handleRegistrationSuccess} />}
                {selectedRole === 'owner' && <OwnerRegisterForm onSuccess={handleRegistrationSuccess} />}
                {selectedRole === 'service_provider' && <ServiceProviderRegisterForm onSuccess={handleRegistrationSuccess} />}
              </div>
            </Box>

            <Paper elevation={0} className="rounded-2xl border border-primary-100 bg-white p-4 md:p-5">
              <Typography variant="subtitle1" fontWeight={700} color="text.primary" className="mb-3">
                Registration Notes
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Students should use their institutional email ending with <strong>@my.sliit.lk</strong>.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Property owner and service provider accounts may require approval before full access.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your data is processed securely and used only for platform services.
                </Typography>
              </Stack>
            </Paper>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
                Sign In
              </Link>
              {' '}|{' '}
              <Link to="/" className="font-medium text-slate-700 hover:text-slate-900">
                Back to Home
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </div>
    </div>
  );
};

export default RegisterPage;
