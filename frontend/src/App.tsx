import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetScenarioDashboard } from './components/BudgetScenarioDashboard';
import { AuthModal } from './components/AuthModal';

function AppContent() {
  const { isAuthenticated, isLoading, workspace } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Loading Vanguard Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return <BudgetScenarioDashboard key={workspace?.id} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
