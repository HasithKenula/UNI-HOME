import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotificationsAsync } from '../features/notifications/notificationSlice';
import useAuth from './useAuth';

const useNotifications = ({ limit = 8, pollMs = 30000 } = {}) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const notificationsState = useSelector((state) => state.notifications);
  const lastFetchAtRef = useRef(0);
  const inFlightRef = useRef(false);

  const requestNotifications = useCallback((minIntervalMs = 0) => {
    const now = Date.now();
    if (inFlightRef.current) {
      return;
    }
    if (minIntervalMs > 0 && now - lastFetchAtRef.current < minIntervalMs) {
      return;
    }

    inFlightRef.current = true;
    lastFetchAtRef.current = now;
    Promise.resolve(dispatch(fetchNotificationsAsync({ page: 1, limit }))).finally(() => {
      inFlightRef.current = false;
    });
  }, [dispatch, limit]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    requestNotifications();

    const intervalId = window.setInterval(() => {
      requestNotifications(5000);
    }, pollMs);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      requestNotifications(8000);
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [isAuthenticated, pollMs, requestNotifications]);

  return notificationsState;
};

export default useNotifications;
