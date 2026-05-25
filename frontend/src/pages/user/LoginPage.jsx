import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userData, setUserData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login failed');
      }

      if (data.requiresPasswordChange) {
        setUserData(data);
        setShowForcePasswordChange(true);
        return;
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate based on role or just default
      if (data.user.role === 'super-admin') {
        navigate('/super-admin');
      } else {
        navigate(`/bulebet/${data.restaurantSlug}/admin`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, oldPassword: password, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to change password');
      }

      // Proceed with original login flow
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));

      if (userData.user.role === 'super-admin') {
        navigate('/super-admin');
      } else {
        navigate(`/bulebet/${userData.restaurantSlug}/admin`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5 min-vh-100 d-flex align-items-center">
      <div className="container" style={{ maxWidth: '450px' }}>
        <div className="card shadow-sm border-0" style={{ borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)' }}>
          <div className="card-body p-4 p-md-5 text-center">
            <h2 className="mb-3">{t('login_welcome') || 'Welcome Back'}</h2>
            <p className="text-muted mb-4">
              {t('login_enter_email') || 'Enter your credentials to login'}
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {showForcePasswordChange ? (
              <form onSubmit={handlePasswordChange} className="text-start">
                <div className="alert alert-warning mb-4" role="alert" style={{ fontSize: '14px' }}>
                  <strong>Security Requirement:</strong> Because you are using a default password, you must set a new password before you can access your dashboard.
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ fontSize: '14px' }}>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new secure password"
                    required 
                    minLength={6}
                    className="form-control p-3"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-100 p-3 fw-bold mb-4" style={{ opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Updating...' : 'Update Password & Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="text-start">
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: '14px' }}>{t('login_email_label') || 'Email Address'}</label>
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login_email_placeholder') || 'admin@example.com'}
                    required 
                    className="form-control p-3"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ fontSize: '14px' }}>Password</label>
                  <input 
                    type="password" 
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required 
                    className="form-control p-3"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-100 p-3 fw-bold mb-4" style={{ opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Signing in...' : (t('login_signin') || 'Sign In')}
                </button>

                <div className="text-center text-muted">
                  {t('login_new') || 'New to BuleBet?'} <Link to="/register" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>{t('login_partner') || 'Become a Partner'}</Link>
                </div>
                <div className="text-center text-muted mt-2" style={{ fontSize: '13px' }}>
                  Invited as a team member? Just log in to activate your account!
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
