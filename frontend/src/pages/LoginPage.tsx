import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserLogin } from '../types/api';
import { Waves, Mail, Lock } from 'lucide-react';
import { Card, Button, Input, FormField, Alert, AlertDescription } from '../components/ui';

const LoginPage = () => {
  const [formData, setFormData] = useState<UserLogin>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-accent/10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <Waves className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-h1 font-semibold text-content-primary">Welcome Back</h1>
          <p className="text-body text-content-secondary mt-1">Sign in to your surf tracker account</p>
        </div>

        {/* Form */}
        <Card className="p-6 shadow-subtle">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <FormField label="Email Address" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-content-quaternary" />
                </div>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </FormField>

            {/* Password Field */}
            <FormField label="Password" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-content-quaternary" />
                </div>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </FormField>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" size="lg" fullWidth disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-content-secondary">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-content-tertiary">
          Track your surf sessions and discover new spots
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
