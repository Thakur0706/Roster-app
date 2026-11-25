import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ops.admin@datastraw-demo.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      try {
        await login(email, password);
      } catch (err1) {
        // Fallback for seeded admin user if ops.admin placeholder was submitted
        if (email === 'ops.admin@datastraw-demo.com') {
          await login('admin@datastraw-demo.com', password);
        } else {
          throw err1;
        }
      }
      navigate('/roster');
    } catch (err) {
      const apiError = err.response?.data?.error;
      const message =
        typeof apiError === 'string'
          ? apiError
          : typeof apiError?.message === 'string'
            ? apiError.message
            : 'Invalid email or password';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Left Column: Dark Showcase */}
      <div className="login-left-pane">
        <div className="login-left-body">
          <div className="login-brand-hero">
            <div className="login-hero-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h1 className="login-hero-title">Smart Roster</h1>
          </div>
          <p className="login-hero-desc">
            Plan monthly team schedules, enforce client-specific coverage rules, and resolve staffing conflicts before publishing.
          </p>
        </div>

        <div className="login-left-footer">
          <div className="login-footer-pill">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <span>365-day SLA validation</span>
          </div>
          <div className="login-footer-pill">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Multi-pod & brand views</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sign in Form */}
      <div className="login-right-pane">
        <div className="login-form-container">
          <div className="login-header-group">
            <h2 className="login-title">Sign in</h2>
            <p className="login-subtitle">Welcome back. Please sign in to continue.</p>
          </div>

          <form onSubmit={submit} className="login-main-form">
            <div className="login-form-group">
              <label className="login-label">Email address</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ops.admin@datastraw-demo.com"
                required
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="login-error-banner">{error}</div>}

            <button type="submit" className="btn-signin-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-footer-help">
            Need workspace access? <strong>Contact Ops Admin</strong>
          </div>

          <div className="login-legal-footer">
            © Smart Roster · Built by{' '}
            <a
              href="https://www.sohamthakur.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="login-author-link"
            >
              Soham Thakur
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
