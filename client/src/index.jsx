import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './tailwind-output.css';
import App from './App';

import { Provider } from 'react-redux';
import { store } from './redux/store';

const GOOGLE_CLIENT_ID = '147393390596-i6vn54sv0j7renvmm8qdni76dsgk3mvu.apps.googleusercontent.com';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);
