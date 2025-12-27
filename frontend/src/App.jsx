import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Salary from './pages/Salary';
import Profile from './pages/Profile';
import Users from './pages/Users';
import ImportSales from './pages/ImportSales';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Dashboard user={user} />} />
          <Route path="sales" element={<Sales user={user} />} />
          <Route path="expenses" element={<Expenses user={user} />} />
          <Route path="salary" element={<Salary user={user} />} />
          <Route path="import-sales" element={<ImportSales user={user} />} />
          <Route path="profile" element={<Profile user={user} />} />
          {user && user.role === 'admin' && <Route path="users" element={<Users user={user} />} />}
        </Route>
        {/* Catch-all route - redirect to login if not authenticated, otherwise to home */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
