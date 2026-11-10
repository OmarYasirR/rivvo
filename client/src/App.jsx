import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import AppRoutes from './routes/AppRoutes';
import RealtimeListener from './components/layout/RealtimeListener';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <RealtimeListener />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      </LanguageProvider>
    </Provider>
  );
}

export default App;
