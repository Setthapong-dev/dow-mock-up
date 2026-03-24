import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-octonary/20 mb-4">
            <UserPlus className="text-octonary" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-quaternary mt-2">Join the asset management system</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-secondary rounded-2xl p-8 shadow-xl border border-tertiary">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-denary/10 border border-denary/30 text-denary text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-quaternary mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-white placeholder-tertiary focus:outline-none focus:border-senary focus:ring-1 focus:ring-senary transition-colors"
              placeholder="Your full name"
            />
          </div>

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
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-white placeholder-tertiary focus:outline-none focus:border-senary focus:ring-1 focus:ring-senary transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-octonary text-white font-medium hover:bg-octonary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-quaternary text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-senary hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
