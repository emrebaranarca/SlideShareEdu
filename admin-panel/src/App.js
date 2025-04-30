// App.js - Main Application Component
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Presentations from './pages/Presentations';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import StudentDetail from './pages/StudentDetail';
import PresentationDetail from './pages/PresentationDetail';
import Layout from './components/Layout';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={login} />
            )
          } 
        />
        
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <Navigate to="/dashboard" replace />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/presentations" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <Presentations />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/presentations/:id" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <PresentationDetail />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/students" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <Students />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/students/:id" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <StudentDetail />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/statistics" 
          element={
            isAuthenticated ? (
              <Layout onLogout={logout}>
                <Statistics />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;