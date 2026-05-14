/**
 * API Configuration
 * Connects to FenixApp Backend
 */

// Base URL for the API
// For local development with Expo, use your machine's IP address
// For production, use the actual API URL
export const API_CONFIG = {
  // Development: Use your local IP (not localhost for mobile devices)
  // BASE_URL: 'http://192.168.1.x:8000/api/v1',

  // Docker on same machine
  // BASE_URL: 'http://localhost:8000/api/v1',

  // Production (through nginx, no port)
  // BASE_URL: 'http://185.129.48.44/api/v1',

  // Production with domain + SSL
  BASE_URL: 'https://zharqyn.life/api/v1',

  TIMEOUT: 30000, // 30 seconds
};

// Media base URL (for user avatars, product images, etc.)
export const MEDIA_BASE_URL = API_CONFIG.BASE_URL.replace('/api/v1', '');

// API Endpoints
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login/json',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHECK_USER: (loginOrId: string) => `/auth/check-user/${loginOrId}`,
  },

  // Users
  USERS: {
    ME: '/users/me',
    DELETE_ACCOUNT: '/users/me/delete',
    BY_ID: (id: number) => `/users/${id}`,
    BY_LOGIN: (login: string) => `/users/by-login/${login}`,
    SPONSOR: (id: number) => `/users/sponsor/${id}`,
    REFERRALS: '/users/referrals',
    COMPANY_STATS: '/users/me/company-stats',
    KONKURS: '/users/me/konkurs',
    PUSH_TOKEN: '/users/me/push-token',
    VERIFICATION: '/users/me/verification',
    CHANGE_PASSWORD: '/users/me/password',
  },

  // Binary Tree
  TREE: {
    GET: (userId: number) => `/tree/${userId}`,
    VOLUMES: (userId: number) => `/tree/volumes/${userId}`,
    FIND_SLOT: (sponsorId: number) => `/tree/find-slot/${sponsorId}`,
    PLACE: '/tree/place',
  },

  // Finance
  FINANCE: {
    BALANCE: '/finance/balance',
    TRANSFER: '/finance/transfer',
    TRANSFERS: '/finance/transfers',
    INTERNAL_TRANSFERS: '/finance/internal-transfers',
    WITHDRAW: '/finance/withdraw',
    WITHDRAW_BONUS: '/finance/withdraw-bonus',
    WITHDRAW_CASHBACK: '/finance/withdraw-cashback',
    WITHDRAW_HISTORY: '/finance/withdraw-history',
    WITHDRAW_BONUS_HISTORY: '/finance/withdraw-bonus-history',
    WITHDRAW_CASHBACK_HISTORY: '/finance/withdraw-cashback-history',
    CANCEL_WITHDRAW: (id: number) => `/finance/cancel-withdraw/${id}`,
    CANCEL_WITHDRAW_BONUS: (id: number) => `/finance/cancel-withdraw-bonus/${id}`,
    CANCEL_WITHDRAW_CASHBACK: (id: number) => `/finance/cancel-withdraw-cashback/${id}`,
    BINARY_HISTORY: '/finance/binary-history',
    BBS_HISTORY: '/finance/bbs-history',
    PASSIVE_HISTORY: '/finance/passive-history',
    UPLINE_HISTORY: '/finance/upline-history',
  },

  // Ranks
  RANKS: {
    PROGRESS: '/ranks/progress',
    HISTORY: '/ranks/history',
    ALL: '/ranks/all',
    REQUIREMENTS: '/ranks/requirements',
  },

  // Shop
  SHOP: {
    PRODUCTS: '/shop/products',
    PRODUCT: (id: number) => `/shop/products/${id}`,
    CATEGORIES: '/shop/categories',
    PURCHASE: '/shop/purchase',
    PURCHASE_PLAN: '/shop/purchase-plan',
    HISTORY: '/shop/purchase-history',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    CHECKOUT: '/orders/checkout',
    CONFIRM: (id: number) => `/orders/${id}/confirm`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    BY_ID: (id: number) => `/notifications/${id}`,
    UNREAD_COUNT: '/notifications/unread-count',
    CATEGORIES: '/notifications/categories',
    MARK_READ: (id: number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
  },
};
