import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ModuleProvider } from './contexts/ModuleContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <ModuleProvider>
        <AppRouter />
      </ModuleProvider>
    </AuthProvider>
  );
}
