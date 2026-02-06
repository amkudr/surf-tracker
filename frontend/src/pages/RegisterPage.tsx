import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserCreate } from '../types/api';
import { Waves, Mail, Lock, Check } from 'lucide-react';
import { Card, Button, Input, FormField, Alert, AlertDescription } from '../components/ui';

const RegisterPage = () => {
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'confirmPassword') {
      setConfirmPassword(e.target.value);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 6 characters', met: formData.password.length >= 6 },
    { text: 'Passwords match', met: formData.password === confirmPassword && formData.password.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-accent/10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <Waves className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-h1 font-semibold text-content-primary">Join Surf Tracker</h1>
          <p className="text-body text-content-secondary mt-1">Create your account to start tracking sessions</p>
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
                  minLength={6}
                  className="pl-10"
                  placeholder="Create a password"
                />
              </div>
            </FormField>

            {/* Confirm Password Field */}
            <FormField label="Confirm Password" required>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-content-quaternary" />
                </div>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-10"
                  placeholder="Confirm your password"
                />
              </div>
            </FormField>

            {/* Password Requirements */}
            {formData.password && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-content-secondary">Password requirements:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          req.met ? 'bg-accent/10' : 'bg-background-secondary'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 ${
                            req.met ? 'text-accent' : 'text-content-tertiary'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          req.met ? 'text-content-primary' : 'text-content-secondary'
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={isLoading || !passwordRequirements.every(req => req.met)}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent"></div>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-content-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-content-tertiary">
          Join the surf community and track your adventures
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
