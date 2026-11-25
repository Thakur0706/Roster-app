import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ['/dashboard', 'Dashboard'],
    ['/roster', 'Roster'],
    ['/employees', 'Employees'],
    ['/brands', 'Brands & Processes'],
    ['/assignments', 'Assignments'],
    ['/leaves', 'Leaves & Holidays'],
  ];

  // Generate initials for avatar (e.g., "OA" for Ops Admin)
  const getInitials = (name) => {
    if (!name) return 'OA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brandmark">
            <span className="brandmark-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="17" rx="3" fill="#2563EB" />
                <path d="M3 9H21" stroke="white" strokeWidth="1.5" />
                <path d="M8 2V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 2V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="13" r="1.2" fill="white" />
                <circle cx="12" cy="13" r="1.2" fill="white" />
                <circle cx="16" cy="13" r="1.2" fill="white" />
                <circle cx="8" cy="17" r="1.2" fill="white" />
                <circle cx="12" cy="17" r="1.2" fill="white" />
                <circle cx="16" cy="17" r="1.2" fill="white" />
              </svg>
            </span>
            <span className="brandmark-text">Smart Roster</span>
          </div>
          <div className="topbar-divider" />
          <nav className="nav">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? 'navlink active' : 'navlink')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="userbox">
          <div className="user-badge">
            <span className="user-avatar">{getInitials(user?.name)}</span>
            <span className="user-name">{user?.name || 'Ops Admin'}</span>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="app-footer-content">
          <span>Smart Roster · Workforce Management System</span>
          <span className="app-footer-divider">·</span>
          <span>
            Built by{' '}
            <a
              href="https://www.sohamthakur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="app-footer-link"
            >
              Soham Thakur
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
