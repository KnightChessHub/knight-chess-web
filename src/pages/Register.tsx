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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-8" style={{ padding: '2rem 1rem' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8" style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-3xl text-white font-semibold leading-none">♔</span>
            </div>
            <h1 className="text-4xl font-semibold text-text-primary leading-tight">Join KnightChess</h1>
          </div>
          <p className="text-text-secondary">Create your account and start playing</p>
        </div>

        <div className="bg-bg-card border border-border rounded-lg p-6" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} className="space-y-4" style={{ gap: '1rem' }}>
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoFocus
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full mt-4" size="lg" style={{ marginTop: '1rem' }}>
              <UserPlus className="w-4 h-4" />
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center" style={{ marginTop: '1.5rem' }}>
            <p className="text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

