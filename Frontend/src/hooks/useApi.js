import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const request = useCallback(
    async (url, options = {}) => {
      setLoading(true);
      setError(null);
      
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...options.headers,
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }

        setLoading(false);
        return { success: true, data };
      } catch (err) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [token]
  );

  return { request, loading, error };
};

export default useApi;
