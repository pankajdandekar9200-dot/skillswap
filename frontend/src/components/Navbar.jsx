import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SwapIcon, HomeIcon, SearchIcon, UserIcon, CalendarIcon, CoinIcon, MenuIcon, XIcon } from './Icons';

const AVATAR_COLORS = [
  '#8A6A4B', '#5C4530', '#4C7A5E', '#3B5998', '#7B4F8A',
  '#A0525A', '#B8863C', '#6B5F54',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" aria-label="SkillSwap home">
            <SwapIcon size={28} />
            <span>SkillSwap</span>
          </Link>

          {user ? (
            <>
              <ul className="navbar-links">
                <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
                <li><Link to="/discover" className={isActive('/discover')}>Discover</Link></li>
                <li><Link to="/sessions" className={isActive('/sessions')}>Sessions</Link></li>
                <li><Link to="/profile" className={isActive('/profile')}>Profile</Link></li>
              </ul>

              <div className="navbar-actions">
                <div className="credit-badge" title="Your credits">
                  <CoinIcon />
                  <span>{user.credit_balance ?? 0}</span>
                </div>
                <Link
                  to="/profile"
                  className="avatar avatar-sm"
                  style={{ background: getAvatarColor(user.name), textDecoration: 'none' }}
                  aria-label="Your profile"
                >
                  {user.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-actions">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up free</Link>
            </div>
          )}

          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon size={24} /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {user ? (
          <>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <Link to="/discover" onClick={() => setMobileOpen(false)}>Discover</Link>
            <Link to="/sessions" onClick={() => setMobileOpen(false)}>Sessions</Link>
            <Link to="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
            <Link to="/skills" onClick={() => setMobileOpen(false)}>My Skills</Link>
            <button className="btn btn-secondary mt-3" onClick={handleLogout} style={{ width: '100%' }}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign up</Link>
          </>
        )}
      </div>

      {/* Bottom tab bar (mobile) */}
      {user && (
        <div className="bottom-tabs" role="navigation" aria-label="Mobile navigation">
          <div className="bottom-tabs-inner">
            <Link to="/dashboard" className={`bottom-tab ${isActive('/dashboard')}`}>
              <HomeIcon />
              <span>Home</span>
            </Link>
            <Link to="/discover" className={`bottom-tab ${isActive('/discover')}`}>
              <SearchIcon />
              <span>Discover</span>
            </Link>
            <Link to="/sessions" className={`bottom-tab ${isActive('/sessions')}`}>
              <CalendarIcon />
              <span>Sessions</span>
            </Link>
            <Link to="/profile" className={`bottom-tab ${isActive('/profile')}`}>
              <UserIcon />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export { getAvatarColor, getInitials };
