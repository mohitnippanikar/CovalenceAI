// API Base URL
export const API_BASE_URL = "https://api.example.com/v1";

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user_data",
};

// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

// Application routes
export const ROUTES = {
  HOME: "/",
  LANDING: "/landing",
  AUTH: {
    LOGIN: "/login",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    UPLOAD_DATA: "/admin/upload-data",
    MANAGE_USERS: "/admin/manage-users",
    FLAGGED_REQUESTS: "/admin/flagged-requests",
    ANALYTICS: "/admin/analytics",
    SETTINGS: "/admin/settings",
  },
  EMPLOYEE: {
    HOME: "/employee",
    CHAT_ASSISTANT: "/employee/chat-assistant",
    DOCUMENTS: "/employee/documents",
    VIEW_UPLOADS: "/employee/view-uploads",
    REQUEST_ACCESS: "/employee/request-access",
    ACTION_SUGGESTIONS: "/employee/action-suggestions",
  },
  NOT_FOUND: "/404",
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REFRESH_TOKEN: "/auth/refresh-token",
  },
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  DOCUMENTS: {
    GET_ALL: "/documents",
    GET_BY_ID: (id: string) => `/documents/${id}`,
    CREATE: "/documents",
    UPDATE: (id: string) => `/documents/${id}`,
    DELETE: (id: string) => `/documents/${id}`,
  },
};

// Message types for chat
export const MESSAGE_TYPES = {
  USER: "user",
  BOT: "bot",
  SYSTEM: "system",
}; 