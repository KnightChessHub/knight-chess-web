import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import { toast } from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const { token, user } = await apiService.register(username, email, password);
      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary" style={{ padding: '2rem 1.5rem' }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center animate-slide-up" style={{ marginBottom: '2.5rem' }}>
          <div className="flex items-center justify-center mb-4" style={{ gap: '1rem' }}>
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 animate-glow">
              <span className="text-3xl text-white font-bold leading-none">♘</span>
            </div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">KnightChess</h1>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Create your account</h2>
          <p className="text-text-secondary">Join thousands of chess players worldwide</p>
        </div>

        {/* Registration Form */}
        <div className="glass-form rounded-2xl animate-scale-in" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
              />
              <p className="text-xs text-text-tertiary" style={{ marginTop: '0.5rem' }}>
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>

            <div className="flex items-start" style={{ gap: '0.75rem', paddingTop: '0.5rem' }}>
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-border bg-bg-tertiary text-primary focus:ring-2 focus:ring-primary flex-shrink-0 cursor-pointer"
                style={{ marginTop: '0.25rem' }}
                required
              />
              <label className="text-sm text-text-secondary leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:text-primary-light font-medium transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary hover:text-primary-light font-medium transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                <UserPlus className="w-4 h-4" />
                Create Account
              </Button>
            </div>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <p className="text-center text-text-secondary text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary-light font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
