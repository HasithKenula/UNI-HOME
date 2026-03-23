import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    loading,
    role: user?.role,
    isStudent: user?.role === 'student',
    isOwner: user?.role === 'owner',
    isServiceProvider: user?.role === 'service_provider',
    isAdmin: user?.role === 'admin',
  };
};

export default useAuth;
