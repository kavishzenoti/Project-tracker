import React from 'react';
import { MagicLinkAuthProvider } from './contexts/MagicLinkAuthContext.jsx';
import { useMagicLinkAuth } from './contexts/MagicLinkAuthContext.jsx';
import DesignSystemTracker from './components/DesignSystemTracker';
import MagicLinkLogin from './components/MagicLinkLogin';
import MagicLinkVerification from './components/MagicLinkVerification';
import { Loader2 } from 'lucide-react';

// Main App Content with Magic Link Authentication Logic
const AppContent = () => {
  const { authState, isAuthenticated, isInitializing } = useMagicLinkAuth();

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Check if we're on the magic link verification route
  // Handle both local development and GitHub Pages paths
  const currentPath = window.location.pathname;
  const isVerificationRoute = currentPath === '/auth/verify' || currentPath === '/Project-tracker/auth/verify';
  
  if (isVerificationRoute) {
    return <MagicLinkVerification />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <MagicLinkLogin />;
  }

  // Show main application if authenticated
  return <DesignSystemTracker />;
};

// Main App Component with Magic Link AuthProvider
function App() {
  return (
    <MagicLinkAuthProvider>
      <AppContent />
    </MagicLinkAuthProvider>
  );
}

export default App; 