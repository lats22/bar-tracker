import { Outlet, Link, useLocation } from 'react-router-dom';

function Layout({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">Siara Bar</div>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          <Link to="/sales" className={isActive('/sales')}>Sales</Link>
          <Link to="/expenses" className={isActive('/expenses')}>Expenses</Link>
          {(user.role === 'admin' || user.role === 'manager') && (
            <Link to="/salary" className={isActive('/salary')}>Salary</Link>
          )}
          {(user.role === 'admin' || user.role === 'manager') && (
            <Link to="/import-sales" className={isActive('/import-sales')}>Import Excel</Link>
          )}
          {user.role === 'admin' && (
            <Link to="/users" className={isActive('/users')}>Users</Link>
          )}
        </div>
        <div className="nav-user">
          <span>{user.fullName} ({user.role})</span>
          <Link to="/profile" className="btn btn-sm">Profile</Link>
          <button onClick={onLogout} className="btn btn-sm">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
