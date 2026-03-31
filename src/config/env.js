// Centralized environment configuration
// Base URL is read from Expo public env or falls back to a default.
// To change it, set EXPO_PUBLIC_API_BASE_URL in your .env or build environment.

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev-api.hexallo.com';

export const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '99999';


