import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetScenarioDashboard } from './components/BudgetScenarioDashboard';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { VanguardEmblem } from './components/VanguardLogo';

type AppView = 'landing' | 'auth' | 'dashboard';

function AppContent() {
  const { isAuthenticated, isLoading, workspace } = useAuth();
  const [view, setView] = useState<AppView>('landing');

  /* Loading spinner */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 animate-pulse">
            <VanguardEmblem size="xl" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-extrabold text-xl tracking-tight flex items-center gap-1.5">
              <span className="text-[#000814]">Vanguard</span>
              <span className="text-[#003566]">Intelligence</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Initializing workspace...</p>
          </div>
          <div className="w-7 h-7 border-[2.5px] border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin mt-1" />
        </div>
      </div>
    );
  }

  /* Already authenticated → go straight to dashboard */
  if (isAuthenticated) {
    return <BudgetScenarioDashboard key={workspace?.id} />;
  }

  /* Landing page */
  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }

  /* Auth page (login / register) */
  return <AuthPage onBack={() => setView('landing')} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
