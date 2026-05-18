import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-accent/20 text-accent-light' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-900/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="font-display flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">🖐️</span>
          <span>
            Gesture<span className="text-accent-light">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={linkClass} end>
            Recognize
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            Analytics
          </NavLink>
          <NavLink to="/auth" className={linkClass}>
            {isAuthenticated ? 'Account' : 'Login'}
          </NavLink>
        </div>
        {isAuthenticated && (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button type="button" onClick={logout} className="btn-secondary text-sm py-1.5">
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
