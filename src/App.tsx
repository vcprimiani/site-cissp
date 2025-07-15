import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { QuestionBankMode } from './components/QuestionBankMode/QuestionBankMode';
import { QuizMode } from './components/QuizMode/QuizMode';
import { PricingPage } from './components/Pricing/PricingPage';
import { SuccessPage } from './components/Success/SuccessPage';
import { PaywallPage } from './components/Paywall/PaywallPage';
import { AppState, AppMode, User } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';
import { BookmarksProvider } from './hooks/useBookmarks';
import { FlagProvider } from './hooks/useFlags';
import { LandingPage } from './components/Landing/LandingPage';
import ResetPassword from './components/Auth/ResetPassword';
// import ProgressPage from './components/Progress/ProgressPage';
// import { ProgressDashboard } from './components/Progress/ProgressDashboard';
import { AdminAccess } from './components/Admin/AdminAccess';
import { PageWrapper } from './components/Layout/PageWrapper';
import { DevBanner } from './components/UI/DevBanner';
import { ToastContainer, useToast } from './components/UI/Toast';
import { initializeToast } from './utils/toast';
import { OnboardPage } from './components/Auth/OnboardPage';
import { ReferralReport } from './components/Auth/ReferralReport';
import { ReferralCodeAdmin } from './components/Admin/ReferralCodeAdmin';

// 🚨 CRITICAL FOR AI AGENTS: All pages/components that use hooks MUST be wrapped in PageWrapper
// This prevents "must be used within Provider" errors
// See: PROVIDER_PATTERN.md for complete documentation

function App() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isActive: hasActiveSubscription, loading: subscriptionLoading, error: subscriptionError } = useSubscription();
  const [appState, setAppState] = useLocalStorage<AppState>('cissp-study-app', {
    mode: 'quiz',
    currentUser: null,
    users: [],
    sessions: [],
    messages: [],
    questions: [],
    currentQuiz: null,
    isAuthenticated: false,
    showAuth: false
  });

  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  React.useEffect(() => {
    initializeToast({ showSuccess, showError, showWarning, showInfo });
  }, [showSuccess, showError, showWarning, showInfo]);

  // Check for URL parameters to determine which page to show
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const currentPath = window.location.pathname;

  // 🚨 Ensure /onboard route is handled first, before any auth or state checks
  if (currentPath === '/onboard') {
    return <OnboardPage />;
  }

  // Update app state when auth state changes
  useEffect(() => {
    if (user && isAuthenticated) {
      const currentUser: User = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'leader',
        createdAt: new Date(user.created_at),
        points: 0,
        sessionsLed: 0,
        questionsContributed: 0,
        achievements: [
          {
            id: 'first-session',
            name: 'First Session Leader',
            description: 'Led your first study session',
            earned: false
          },
          {
            id: 'consistent-leader',
            name: 'Consistent Leader',
            description: 'Led 5 study sessions',
            earned: false
          },
          {
            id: 'knowledge-sharer',
            name: 'Knowledge Sharer',
            description: 'Added 10 questions to the bank',
            earned: false
          },
          {
            id: 'quiz-master',
            name: 'Quiz Master',
            description: 'Created 25 questions',
            earned: false
          },
          {
            id: 'team-player',
            name: 'Team Player',
            description: 'Received 50 likes on messages',
            earned: false
          }
        ],
        avatar_url: user.user_metadata?.avatar_url
      };

      setAppState(prev => ({
        ...prev,
        currentUser,
        isAuthenticated: true
      }));
    } else if (!isAuthenticated && !authLoading) {
      setAppState(prev => ({
        ...prev,
        currentUser: null,
        isAuthenticated: false
      }));
    }
  }, [user, isAuthenticated, authLoading, setAppState]);

  const handleModeChange = (mode: AppMode) => {
    setAppState(prev => ({ ...prev, mode }));
    
    // If we're on the admin page, navigate back to the main app
    if (currentPath === '/admin') {
      window.location.href = '/';
    }
  };

  const handleUpdateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  // Show loading spinner while checking authentication and subscription
  if (authLoading || (isAuthenticated && subscriptionLoading)) {
    return (
      <>
        <DevBanner />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Loading...' : 'Checking subscription...'}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show success page if there's a session_id parameter OR if the path is /success (after successful payment)
  if ((sessionId || currentPath === '/success') && isAuthenticated && appState.currentUser) {
    return <>
      <DevBanner />
      <SuccessPage />
    </>;
  }

  // Show pricing page if the path is /pricing
  if (currentPath === '/pricing' && isAuthenticated && appState.currentUser) {
    return (
      <>
        <DevBanner />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 mt-12">
          <Header
            mode={appState.mode}
            onModeChange={handleModeChange}
            currentUser={appState.currentUser}
            onLogout={() => {}} // Logout is handled by the useAuth hook
            hasActiveSubscription={hasActiveSubscription}
            subscriptionLoading={subscriptionLoading}
          />
          <PricingPage />
        </div>
      </>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated || !appState.currentUser) {
    // Show auth form if showAuth is true, otherwise show landing page
    if (appState.showAuth) {
      return <>
        <DevBanner />
        <AuthForm onBackToLanding={() => setAppState(prev => ({ ...prev, showAuth: false }))} />
      </>;
    }
    // Always show landing page for unauthenticated users
    return <>
      <DevBanner />
      <LandingPage onGetStarted={() => {
        // This will show the AuthForm component
        setAppState(prev => ({ ...prev, showAuth: true }));
      }} />
    </>;
  }

  // Show reset password page if the path is /reset-password
  if (currentPath === '/reset-password') {
    return <>
      <DevBanner />
      <ResetPassword />
    </>;
  }

  // Add onboarding route for LearnWorlds SSO/magic link
  // if (currentPath === '/onboard') {
  //   return <OnboardPage />;
  // }

  // Add referral report page (direct URL only, no link)
  if (currentPath === '/referral-report') {
    return <ReferralReport />;
  }

  // Add referral code admin page (direct URL only, no link)
  if (currentPath === '/admin/referral-codes') {
    return <ReferralCodeAdmin />;
  }

  // Show progress page if the path is /progress
  // if (currentPath === '/progress' && isAuthenticated && appState.currentUser) {
  //   return <>
  //     <DevBanner />
  //     <PageWrapper>
  //       <Header
  //         mode={appState.mode}
  //         onModeChange={handleModeChange}
  //         currentUser={appState.currentUser}
  //         onLogout={() => {}}
  //         hasActiveSubscription={hasActiveSubscription}
  //         subscriptionLoading={subscriptionLoading}
  //       />
  //       <ProgressDashboard userId={appState.currentUser.id} />
  //     </PageWrapper>
  //   </>;
  // }

  // Show admin page if the path is /admin
  if (currentPath === '/admin') {
    return (
      <>
        <DevBanner />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 mt-12">
          <Header
            mode={appState.mode}
            onModeChange={handleModeChange}
            currentUser={appState.currentUser}
            onLogout={() => {}} // Logout is handled by the useAuth hook
            hasActiveSubscription={hasActiveSubscription}
            subscriptionLoading={subscriptionLoading}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* 🚨 CRITICAL: AdminAccess uses hooks, so it MUST be wrapped in PageWrapper */}
            <PageWrapper>
              <AdminAccess 
                hasActiveSubscription={hasActiveSubscription}
                subscriptionLoading={subscriptionLoading}
              />
            </PageWrapper>
          </div>
        </div>
      </>
    );
  }

  // Show error if subscription check fails
  if (isAuthenticated && !subscriptionLoading && subscriptionError) {
    return (
      <>
        <DevBanner />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-red-700 font-semibold">
              There was a problem checking your subscription. Please try refreshing the page or contact support.
            </p>
            <pre className="text-xs text-red-500 mt-2">{subscriptionError}</pre>
          </div>
        </div>
      </>
    );
  }

  // Show full app for authenticated users with active subscription
  return (
    <>
      <DevBanner />
      <div className="mt-12">
        {/* 🚨 CRITICAL: Main app uses hooks, so it MUST be wrapped in PageWrapper */}
        <PageWrapper>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Header
              mode={appState.mode}
              onModeChange={handleModeChange}
              currentUser={appState.currentUser}
              onLogout={() => {}} // Logout is handled by the useAuth hook
              hasActiveSubscription={hasActiveSubscription}
              subscriptionLoading={subscriptionLoading}
            />
            <main>
              {appState.mode === 'question-bank' ? (
                <QuestionBankMode 
                  appState={appState} 
                  onUpdateState={handleUpdateState}
                  hasActiveSubscription={hasActiveSubscription}
                  subscriptionLoading={subscriptionLoading}
                />
              ) : (
                <QuizMode 
                  appState={appState} 
                  onUpdateState={handleUpdateState}
                  hasActiveSubscription={hasActiveSubscription}
                  subscriptionLoading={subscriptionLoading}
                />
              )}
            </main>
          </div>
        </PageWrapper>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

export default App;