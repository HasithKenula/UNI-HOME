import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotificationsAsync } from '../features/notifications/notificationSlice';
import useAuth from './useAuth';

const useNotifications = ({ limit = 8, pollMs = 30000 } = {}) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const notificationsState = useSelector((state) => state.notifications);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    dispatch(fetchNotificationsAsync({ page: 1, limit }));

    const intervalId = window.setInterval(() => {
      dispatch(fetchNotificationsAsync({ page: 1, limit }));
    }, pollMs);

    const onVisibilityOrFocus = () => {
      dispatch(fetchNotificationsAsync({ page: 1, limit }));
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [dispatch, isAuthenticated, limit, pollMs]);

  return notificationsState;
};

export default useNotifications;
