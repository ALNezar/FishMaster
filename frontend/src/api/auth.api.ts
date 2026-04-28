// Authentication API endpoints

import { apiRequest } from './client';
import { setToken, removeToken } from './utils/token';
import { AuthResponse } from './types';

const getAuthErrorMessage = (error: any): string => {
  switch (error?.status) {
    case 400:
      return 'Invalid request data';
    case 401:
      return 'Invalid email or password';
    case 403:
      return 'Please verify your email first';
    case 404:
      return 'Account not found';
    case 409:
      return 'Email already registered';
    case 500:
      return 'Server error. Please try again later';
    default:
      return 'Something went wrong';
  }
};

export const signup = async (
  username: string,
  email: string,
  password: string
): Promise<any> => {
  try {
    return await apiRequest('/auth/signup', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ username, email, password }),
    });
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const verifyEmail = async (
  email: string,
  verificationCode: string
): Promise<any> => {
  try {
    return await apiRequest('/auth/verify', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, verificationCode }),
    });
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const resendVerificationCode = async (
  email: string
): Promise<any> => {
  try {
    return await apiRequest('/auth/resend', {
      method: 'POST',
      includeAuth: false,
      body: email,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      includeAuth: false,
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      setToken(res.token);
    }

    return res;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const logout = (): void => {
  removeToken();
};