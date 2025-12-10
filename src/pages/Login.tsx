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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden" style={{ padding: '2rem 1.5rem' }}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 gradient-hero opacity-50"></div>
      <div className="absolute top-0 right-0 w-96 h-96 gradient-glow rounded-full blur-3xl opacity-30 animate-pulse-glow"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 gradient-glow rounded-full blur-3xl opacity-20 animate-float"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center animate-slide-up" style={{ marginBottom: '2.5rem' }}>
          <div className="flex items-center justify-center mb-4" style={{ gap: '1rem' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center flex-shrink-0 shadow-premium animate-pulse-glow">
              <span className="text-3xl text-white font-bold leading-none">♘</span>
            </div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight bg-gradient-to-r from-text-primary to-primary-light bg-clip-text text-transparent">KnightChess</h1>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
          <p className="text-text-secondary">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="glass-form rounded-2xl animate-scale-in shadow-premium border-2 border-primary/20" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
