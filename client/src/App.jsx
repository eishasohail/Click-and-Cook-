import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import SignUp from './components/SignIn_SignUp/SignUp';
import SignIn from './components/SignIn_SignUp/SignIn';
import Form from './components/recipe/form';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AIRecipeGenerator from './pages/AIRecipeGenerator';
import SmartLibrary from './pages/SmartLibrary';
import PersonalizedPicks from './pages/PersonalizedPicks';

const AppContent = () => {
  const location = useLocation();
  // We don't need the old global header/footer anymore as the new Landing page and Forms handle their own branding.
  
  return (
    <div className="app-main-wrapper">
      <Routes>
        {/* NEW ELITE FLOW */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        
        {/* DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recipe-form" element={<Form />} />
        
        {/* SUB-PAGES */}
        <Route path="/ai-recipes" element={<AIRecipeGenerator />} />
        <Route path="/smart-library" element={<SmartLibrary />} />

        <Route path="/personalized-picks" element={<PersonalizedPicks />} />
        
        {/* FALLBACKS */}
        <Route path="/recipe-recommendation" element={<Navigate to="/dashboard" replace />} />
        <Route path="/preview" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
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
