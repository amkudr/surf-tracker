import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui';

let demoLoginStarted = false;

export default function DemoLoginPage() {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoLoginStarted) return;
    demoLoginStarted = true;

    demoLogin()
      .then(() => {
        // Use SPA navigation — the user object is already set in AuthContext
        // by demoLogin(), so navigating without a full reload is safe and
        // avoids the "blank page on first visit" race condition.
        navigate('/');
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Failed to load demo. Please try again later.';
        setError(msg);
      });
  }, [demoLogin, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <a href="/login" className="text-accent hover:underline">Log in manually</a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading text="Loading demo mode..." />
    </div>
  );
}
