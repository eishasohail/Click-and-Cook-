import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import SignUp from './components/SignIn_SignUp/SignUp';
import SignIn from './components/SignIn_SignUp/SignIn';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AIRecipeGenerator from './pages/AIRecipeGenerator';
import SmartLibrary from './pages/SmartLibrary';
import PersonalizedPicks from './pages/PersonalizedPicks';

import PageLoader from './components/shared/PageLoader';
import usePageLoader from './hooks/usePageLoader';

const AppContent = () => {
  const isLoading = usePageLoader();
  const { pathname } = useLocation();

  // Always scroll to top when navigating to a new screen
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <PageLoader isVisible={isLoading} />
      <div className="app-main-wrapper">
        <Routes>
          {/* NEW ELITE FLOW */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          
          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* SUB-PAGES */}
          <Route path="/ai-recipes" element={<AIRecipeGenerator />} />
          <Route path="/library" element={<SmartLibrary />} />

          <Route path="/personalized-picks" element={<PersonalizedPicks />} />
          
          {/* FALLBACKS */}
          <Route path="/recipe-recommendation" element={<Navigate to="/dashboard" replace />} />
          <Route path="/preview" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
