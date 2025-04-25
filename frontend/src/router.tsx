import React from 'react';
import { createBrowserRouter, RouteObject, Navigate } from 'react-router-dom';
import { USER_ROLES, ROUTES } from './utils/constants';

// Auth pages
import Login from './pages/auth/Login';
import LandingPage from './pages/LandingPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UploadData from './pages/admin/UploadData';
import ManageUsers from './pages/admin/ManageUsers';
import FlaggedRequests from './pages/admin/FlaggedRequests';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

// Employee pages
import EmployeeHome from './pages/employee/Home';
import ChatAssistant from './pages/employee/ChatAssistant';
import ViewUploads from './pages/employee/ViewUploads';
import Documents from './pages/employee/Documents';
import RequestAccess from './pages/employee/RequestAccess';
import ActionSuggestions from './pages/employee/ActionSuggestions';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Shared components
import NotFound from './pages/NotFound';
import ProtectedRoute from './routes/ProtectedRoutes';
import App from './App';

// Define the routes
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Landing page route
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: ROUTES.LANDING,
        element: <LandingPage />,
      },
      
      // Auth routes
      {
        path: ROUTES.AUTH.LOGIN,
        element: <Login />,
      },
      
      // Admin routes
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: 'upload-data',
            element: <UploadData />,
          },
          {
            path: 'manage-users',
            element: <ManageUsers />,
          },
          {
            path: 'flagged-requests',
            element: <FlaggedRequests />,
          },
          {
            path: 'analytics',
            element: <Analytics />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
        ],
      },
      
      // Employee routes
      {
        path: 'employee',
        element: (
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE]}>
            <EmployeeLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <EmployeeHome />,
          },
          {
            path: 'chat-assistant',
            element: <ChatAssistant />,
          },
          {
            path: 'documents',
            element: <Documents />,
          },
          {
            path: 'view-uploads',
            element: <ViewUploads />,
          },
          {
            path: 'request-access',
            element: <RequestAccess />,
          },
          {
            path: 'action-suggestions',
            element: <ActionSuggestions />,
          },
        ],
      },
      
      // Not found route
      {
        path: '*',
        element: <Navigate to={ROUTES.NOT_FOUND} replace />,
      },
    ],
  },
];

// Create the router
const router = createBrowserRouter(routes);

export default router; 