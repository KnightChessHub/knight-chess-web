import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import { toast } from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token, user } = await apiService.login(email, password);
      setAuth(user, token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary" style={{ padding: '2rem 1.5rem' }}>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl text-white font-bold leading-none">♘</span>
            </div>
            <h1 className="text-3xl font-semibold text-text-primary">KnightChess</h1>
          </div>
          <h2 className="text-xl font-semibold text-text-primary" style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
          <p className="text-text-secondary text-sm">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-bg-card border border-border rounded-xl" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between" style={{ paddingTop: '0.5rem' }}>
              <label className="flex items-center cursor-pointer group" style={{ gap: '0.625rem' }}>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-bg-tertiary text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-light font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
            <p className="text-center text-text-secondary text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary-light font-semibold transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
