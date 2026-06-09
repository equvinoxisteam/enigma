import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError, clearSuccessMessage } from '../../store/slices/authSlice';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const { isLoading, error, successMessage } = useSelector(state => state.auth);
  const token = new URLSearchParams(location.search).get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ new: false, confirm: false });
  const [resetComplete, setResetComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    dispatch(clearError()); dispatch(clearSuccessMessage());
    setTimeout(() => setVisible(true), 60);
  }, [dispatch]);

  useEffect(() => { if (successMessage) { showSuccess(successMessage); dispatch(clearSuccessMessage()); } }, [successMessage, showSuccess, dispatch]);
  useEffect(() => { if (error) { showError(error); dispatch(clearError()); } }, [error, showError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const getStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = getStrength(formData.newPassword);
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength];

  const validate = () => {
    const errs = {};
    if (!formData.newPassword) errs.newPassword = 'Password is required';
    else if (formData.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (formData.newPassword !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !token) return;
    dispatch(clearError()); dispatch(clearSuccessMessage());
    const result = await dispatch(resetPassword({ token, newPassword: formData.newPassword, confirmPassword: formData.confirmPassword }));
    if (resetPassword.fulfilled.match(result)) {
      setResetComplete(true);
      setTimeout(() => navigate('/role-selection'), 3000);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.85rem 2.8rem', boxSizing: 'border-box',
    background: focused === field ? 'rgba(72,129,248,0.06)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${validationErrors[field] ? 'rgba(248,113,113,0.7)' : focused === field ? 'rgba(72,129,248,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none',
    boxShadow: focused === field ? '0 0 0 3px rgba(72,129,248,0.15)' : 'none', transition: 'all 0.2s',
  });

  if (!token) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#06091a,#0d1433,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: '2rem' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '3rem 2.5rem', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Invalid Reset Link</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', lineHeight: 1.6 }}>This link is invalid or has expired. Please request a new one.</p>
        <Link to="/forgot-password" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#4881F8,#6366f1)', color: '#fff', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: '12px', textDecoration: 'none' }}>Request New Link</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#06091a 0%,#0d1433 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::placeholder { color: rgba(255,255,255,0.3); }
        .rp-card { opacity:0; transform:translateY(28px); transition: opacity 0.65s ease, transform 0.65s cubic-bezier(.22,1,.36,1); }
        .rp-card.v { opacity:1; transform:translateY(0); }
        .rp-btn { background: linear-gradient(135deg,#4881F8,#6366f1); border:none; border-radius:12px; color:#fff; font-size:1rem; font-weight:600; padding:0.9rem; cursor:pointer; width:100%; transition: opacity 0.2s, transform 0.18s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .rp-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .rp-btn:disabled { opacity:0.55; cursor:not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkPop { 0% { transform:scale(0); } 70% { transform:scale(1.15); } 100% { transform:scale(1); } }
        .check-anim { animation: checkPop 0.5s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(72,129,248,0.07) 0%,transparent 70%)', top: '-150px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)', bottom: '-80px', left: '-80px', pointerEvents: 'none' }} />

      <div className={`rp-card ${visible ? 'v' : ''}`} style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem 2.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src="/indianet png.png" alt="Enigma" style={{ height: '48px', width: 'auto', filter: 'brightness(1.1)', margin: '0 auto' }} />
          </div>

          {resetComplete ? (
            <div style={{ textAlign: 'center' }}>
              <div className="check-anim" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Password Reset!</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '2rem' }}>Your password has been successfully reset. Redirecting to login...</p>
              <Link to="/role-selection" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#4881F8,#6366f1)', color: '#fff', fontWeight: 600, padding: '0.75rem 2rem', borderRadius: '12px', textDecoration: 'none' }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(72,129,248,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(72,129,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Lock size={26} color="#4881F8" />
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>Enter your new password below</p>

              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused === 'newPassword' ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                    <input type={show.new ? 'text' : 'password'} name="newPassword" value={formData.newPassword}
                      onChange={handleChange} onFocus={() => setFocused('newPassword')} onBlur={() => setFocused(null)}
                      placeholder="Enter new password" style={{ ...inputStyle('newPassword'), paddingRight: '2.8rem' }} />
                    <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }}>
                      {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password strength meter */}
                  {formData.newPassword && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? strengthColor : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <p style={{ color: strengthColor, fontSize: '0.78rem', fontWeight: 500 }}>{strengthLabel}</p>
                    </div>
                  )}
                  {validationErrors.newPassword && <p style={{ color: 'rgba(248,113,113,0.9)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{validationErrors.newPassword}</p>}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused === 'confirmPassword' ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                    <input type={show.confirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                      onChange={handleChange} onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                      placeholder="Confirm your password" style={{ ...inputStyle('confirmPassword'), paddingRight: '2.8rem' }} />
                    <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }}>
                      {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p style={{ color: formData.newPassword === formData.confirmPassword ? '#22c55e' : 'rgba(248,113,113,0.9)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                      {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                  {validationErrors.confirmPassword && <p style={{ color: 'rgba(248,113,113,0.9)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{validationErrors.confirmPassword}</p>}
                </div>

                <button type="submit" className="rp-btn" disabled={isLoading}>
                  {isLoading ? <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Resetting...</> : 'Reset Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to="/role-selection" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', textDecoration: 'none' }}>Back to Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;