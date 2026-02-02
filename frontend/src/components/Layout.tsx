import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, User, Waves } from 'lucide-react';
import { useState } from 'react';

const AppShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/spots', label: 'Spots' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Quiet chrome, focus on content */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Brand - Minimal, no hover effects on logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Waves className="h-6 w-6 text-accent" />
              <span className="text-h4 font-semibold text-content-primary">Surf Tracker</span>
            </Link>

            {/* Desktop Navigation - Clear active state */}
            <nav className="hidden md:flex space-x-6">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-2 text-body font-medium transition-colors rounded-md ${
                    isActive(path)
                      ? 'text-accent bg-accent/5'
                      : 'text-content-secondary hover:text-content-primary hover:bg-background-secondary'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* User Menu - Sign Out clearly destructive */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-content-tertiary" />
                <span className="text-body text-content-secondary">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-body font-medium text-destructive hover:text-destructive-hover hover:bg-destructive/5 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation - Consistent active states */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-1">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`block px-3 py-2 text-body font-medium transition-colors rounded-md ${
                    isActive(path)
                      ? 'text-accent bg-accent/5'
                      : 'text-content-secondary hover:text-content-primary hover:bg-background-secondary'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center space-x-2 px-3 py-2">
                  <User className="h-4 w-4 text-content-tertiary" />
                  <span className="text-body text-content-secondary">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-body font-medium text-destructive hover:text-destructive-hover hover:bg-destructive/5 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Consistent container width and spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;