import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginAsync } from '../../features/auth/authSlice';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

const PASSWORD_REGEX = /^[A-Z].{8,}$/;

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
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = 'Password must start with a capital letter and be more than 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(nextFormData);

    setErrors((prev) => {
      const updatedErrors = { ...prev };

      if (name === 'email') {
        const trimmedEmail = value.trim();
        if (!trimmedEmail) {
          updatedErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
          updatedErrors.email = 'Email is invalid';
        } else {
          updatedErrors.email = '';
        }
      }

      if (name === 'password') {
        if (!value.trim()) {
          updatedErrors.password = 'Password is required';
        } else if (!PASSWORD_REGEX.test(value)) {
          updatedErrors.password = 'Password must start with a capital letter and be more than 8 characters';
        } else {
          updatedErrors.password = '';
        }
      }

      return updatedErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(loginAsync({
      ...formData,
      email: formData.email.trim(),
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.2),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.3),transparent_45%),linear-gradient(120deg,#0f172a,#111827_45%,#1e293b)]" />
      <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-xl items-center">
        <Paper
          elevation={0}
          className="w-full rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl md:p-8"
        >
          <Stack spacing={3}>
            <Box className="text-center">
              <Box className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg">
                <HomeRoundedIcon />
              </Box>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue managing your UniHome experience
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email || ' '}
                  placeholder="name@example.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={Boolean(errors.password)}
                  helperText={errors.password || ' '}
                  placeholder="Enter your password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box className="flex items-center justify-between">
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label={<Typography variant="body2">Remember me</Typography>}
                  />
                  <Link to="/forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={!loading ? <ArrowForwardRoundedIcon /> : null}
                  sx={{
                    borderRadius: '14px',
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)',
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                Create one
              </Link>
            </Typography>

            <Alert severity="info" variant="outlined" className="rounded-2xl">
              Demo password: <strong>Password123!</strong>
            </Alert>

            <Typography variant="body2" textAlign="center">
              <Link to="/" className="font-medium text-slate-600 hover:text-slate-900">
                Back to Home
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </div>
    </div>
  );
};

export default LoginPage;
