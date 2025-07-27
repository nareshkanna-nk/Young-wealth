import { useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '../types/auth';

const API_BASE_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('youngwealth_token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuthState({
            isAuthenticated: true,
            user: data.user,
            loading: false,
          });
        } else {
          localStorage.removeItem('youngwealth_token');
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('youngwealth_token');
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('youngwealth_token', data.token);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          loading: false,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: signupData.fullName,
          email: signupData.email,
          password: signupData.password,
          role: signupData.role,
          schoolType: signupData.schoolType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('youngwealth_token', data.token);
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          loading: false,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('youngwealth_token');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'school-student':
        return '/dashboard/school';
      case 'college-student':
        return '/dashboard/college';
      case 'employee':
        return '/dashboard/employee';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard/school';
    }
  };

  return {
    ...authState,
    login,
    signup,
    logout,
    getDashboardRoute,
  };
};