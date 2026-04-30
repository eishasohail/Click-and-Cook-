import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import SignUp from './components/SignIn_SignUp/SignUp';
import SignIn from './components/SignIn_SignUp/SignIn';
import Form from './components/recipe/form';
import Landing from './pages/Landing';

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
        
        {/* DASHBOARD (RECIPE FORM) */}
        <Route path="/dashboard" element={<Form />} />
        
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
