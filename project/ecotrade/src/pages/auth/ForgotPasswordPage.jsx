import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, RefreshCw } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../../contexts/ToastContext';
import { forgotPassword, clearError, clearSuccessMessage } from '../../store/slices/authSlice';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, successMessage } = useSelector(state => state.auth);
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    setTimeout(() => setVisible(true), 60);
  }, [dispatch]);

  useEffect(() => {
    if (error) { showError(error); dispatch(clearError()); }
    if (successMessage) { showSuccess(successMessage); dispatch(clearSuccessMessage()); }
  }, [error, successMessage, showError, showSuccess, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { showError('Please enter your email address.'); return; }
    dispatch(clearError()); dispatch(clearSuccessMessage());
    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) setEmailSent(true);
  };

  const handleResend = async () => {
    dispatch(clearError()); dispatch(clearSuccessMessage());
    await dispatch(forgotPassword(email));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#06091a 0%,#0d1433 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::placeholder { color: rgba(255,255,255,0.3); }
        .fp-card { opacity:0; transform:translateY(28px); transition: opacity 0.65s ease, transform 0.65s cubic-bezier(.22,1,.36,1); }
        .fp-card.v { opacity:1; transform:translateY(0); }
        .fp-btn { background: linear-gradient(135deg,#4881F8,#6366f1); border:none; border-radius:12px; color:#fff; font-size:1rem; font-weight:600; padding:0.9rem; cursor:pointer; width:100%; transition: opacity 0.2s, transform 0.18s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .fp-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .fp-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .fp-outline { background:transparent; border:1px solid rgba(255,255,255,0.15); border-radius:12px; color:rgba(255,255,255,0.7); font-size:0.95rem; font-weight:500; padding:0.9rem; cursor:pointer; width:100%; transition: all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .fp-outline:hover:not(:disabled) { border-color:rgba(72,129,248,0.5); color:#4881F8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkPop { 0% { transform:scale(0); opacity:0; } 70% { transform:scale(1.15); } 100% { transform:scale(1); opacity:1; } }
        .check-anim { animation: checkPop 0.5s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes pulse-ring { 0% { transform:scale(0.9); opacity:0.6; } 100% { transform:scale(1.4); opacity:0; } }
        .pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(72,129,248,0.07) 0%, transparent 70%)', top: '-150px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', bottom: '-80px', left: '-80px', pointerEvents: 'none' }} />

      <div className={`fp-card ${visible ? 'v' : ''}`} style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem 2.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src="/enigma-logo.svg" alt="Enigma" style={{ height: '48px', width: 'auto', filter: 'brightness(1.1)', margin: '0 auto' }} />
          </div>

          {!emailSent ? (
            <>
              {/* Icon */}
              <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 1.5rem' }}>
                <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(72,129,248,0.2)' }} />
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(72,129,248,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(72,129,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={26} color="#4881F8" />
                </div>
              </div>

              <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', letterSpacing: '-0.015em' }}>Forgot Password?</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                No worries! Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                    <input
                      id="forgot-email"
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                      placeholder="Enter your email address"
                      required
                      style={{
                        width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.8rem', boxSizing: 'border-box',
                        background: focused ? 'rgba(72,129,248,0.06)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${focused ? 'rgba(72,129,248,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(72,129,248,0.15)' : 'none', transition: 'all 0.2s',
                      }}
                    />
                  </div>
                </div>

                <button type="submit" className="fp-btn" id="forgot-submit-btn" disabled={isLoading}>
                  {isLoading ? <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Sending...</> : <><Send size={18} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="check-anim" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>Check Your Email</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                We've sent a reset link to
              </p>
              <p style={{ color: '#4881F8', textAlign: 'center', fontWeight: 600, marginBottom: '2rem', fontSize: '0.95rem' }}>{email}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.82rem', marginBottom: '1.75rem' }}>
                Check your spam folder if you don't see it.
              </p>

              <button onClick={handleResend} className="fp-outline" disabled={isLoading}>
                {isLoading ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid currentColor', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Resending...</> : <><RefreshCw size={16} /> Resend Email</>}
              </button>

              <button onClick={() => { setEmailSent(false); setEmail(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', display: 'block', margin: '1rem auto 0', textDecoration: 'underline', textDecorationColor: 'transparent' }}
                onMouseEnter={e => e.target.style.textDecorationColor = 'currentColor'}
                onMouseLeave={e => e.target.style.textDecorationColor = 'transparent'}>
                Try a different email
              </button>
            </>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#4881F8'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}>
              <ArrowLeft size={15} /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
