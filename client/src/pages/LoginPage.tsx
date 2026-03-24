import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      setError(msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-senary/20 mb-4">
            <LogIn className="text-senary" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">Asset Manager</h1>
          <p className="text-quaternary mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-secondary rounded-2xl p-8 shadow-xl border border-tertiary">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-denary/10 border border-denary/30 text-denary text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-quaternary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-white placeholder-tertiary focus:outline-none focus:border-senary focus:ring-1 focus:ring-senary transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-quaternary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-white placeholder-tertiary focus:outline-none focus:border-senary focus:ring-1 focus:ring-senary transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-senary text-white font-medium hover:bg-senary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-quaternary text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-senary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
