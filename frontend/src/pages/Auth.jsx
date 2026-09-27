import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SwapIcon } from '../components/Icons';
import './Auth.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-container container-sm">
        <div className="auth-header text-center">
          <SwapIcon size={40} />
          <h1>Welcome back</h1>
          <p>Log in to continue your skill journey</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p>Don't have an account? <Link to="/signup">Sign up free</Link></p>
        </div>

        <div className="demo-hint card card-tint-peach">
          <strong>Demo account:</strong> Try <code>Pankaj@demo.edu</code> / <code>password123</code>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters.';
    if (!form.email) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.college);
      toast.success('Account created! Let\'s set up your skills.');
      navigate('/skills');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page">
      <div className="auth-container container-sm">
        <div className="auth-header text-center">
          <SwapIcon size={40} />
          <h1>Join SkillSwap</h1>
          <p>Create your free account and start learning today</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full name</label>
            <input id="signup-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Pankaj dandekar" value={form.name} onChange={set('name')} autoComplete="name" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email</label>
            <input id="signup-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@college.edu" value={form.email} onChange={set('email')} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input id="signup-password" type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="At least 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="signup-college" className="form-label">College / University <small>(optional)</small></label>
            <input id="signup-college" type="text" className="form-input" placeholder="e.g. IIT Delhi" value={form.college} onChange={set('college')} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer text-center">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
