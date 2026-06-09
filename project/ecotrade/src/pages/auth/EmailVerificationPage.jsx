import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail, resendVerificationEmail, clearError, clearSuccessMessage } from '../../store/slices/authSlice';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const { isLoading, error, successMessage } = useSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    dispatch(clearError()); dispatch(clearSuccessMessage());
    const searchParams = new URLSearchParams(location.search);
    const emailFromUrl = searchParams.get('email');
    const tokenFromUrl = searchParams.get('token');
    if (emailFromUrl) setEmail(emailFromUrl);
    const verificationToken = token || tokenFromUrl;
    if (verificationToken && !isVerifying && !verificationComplete) {
      setIsVerifying(true);
      handleVerification(verificationToken);
    }
    setTimeout(() => setVisible(true), 60);
  }, [token, location.search]);

  useEffect(() => { if (error && !verificationComplete) { showError(error); dispatch(clearError()); } }, [error, showError, dispatch, verificationComplete]);
  useEffect(() => { if (successMessage) { showSuccess(successMessage); dispatch(clearSuccessMessage()); } }, [successMessage, showSuccess, dispatch]);

  const handleVerification = async (verificationToken) => {
    setIsVerifying(true);
    dispatch(clearError()); dispatch(clearSuccessMessage());
    try {
      const result = await dispatch(verifyEmail(verificationToken));
      if (verifyEmail.fulfilled.match(result)) {
        setVerificationComplete(true);
        setTimeout(() => navigate('/login', { state: null }), 3000);
      }
    } catch (err) { console.error('Verification error:', err); }
    finally { setIsVerifying(false); }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email) return;
    dispatch(clearError()); dispatch(clearSuccessMessage());
    await dispatch(resendVerificationEmail(email));
  };

  const hasToken = token || new URLSearchParams(location.search).get('token');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#06091a 0%,#0d1433 50%,#0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::placeholder { color: rgba(255,255,255,0.3); }
        .ev-card { opacity:0; transform:translateY(28px); transition: opacity 0.65s ease, transform 0.65s cubic-bezier(.22,1,.36,1); }
        .ev-card.v { opacity:1; transform:translateY(0); }
        .ev-btn { background: linear-gradient(135deg,#4881F8,#6366f1); border:none; border-radius:12px; color:#fff; font-size:0.95rem; font-weight:600; padding:0.85rem; cursor:pointer; width:100%; transition: opacity 0.2s, transform 0.18s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .ev-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .ev-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .ev-outline { background:transparent; border:1px solid rgba(255,255,255,0.15); border-radius:12px; color:rgba(255,255,255,0.7); font-size:0.95rem; font-weight:500; padding:0.85rem; cursor:pointer; width:100%; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .ev-outline:hover { border-color:rgba(72,129,248,0.5); color:#4881F8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes envelope-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes checkPop { 0% { transform:scale(0); } 70% { transform:scale(1.2); } 100% { transform:scale(1); } }
        .env-anim { animation: envelope-float 2.5s ease-in-out infinite; }
        .check-anim { animation: checkPop 0.5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes progress { from { width:0%; } to { width:100%; } }
        .progress-bar { animation: progress 3s linear both; }
      `}</style>

      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(72,129,248,0.07) 0%,transparent 70%)', top: '-150px', right: '-100px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)', bottom: '-80px', left: '-80px', pointerEvents: 'none' }} />

      <div className={`ev-card ${visible ? 'v' : ''}`} style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/indianet png.png" alt="Enigma" style={{ height: '44px', width: 'auto', filter: 'brightness(1.1)' }} />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem 2.25rem' }}>

          {/* Auto-verifying via token */}
          {hasToken && !verificationComplete && isVerifying && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(72,129,248,0.15)', border: '1px solid rgba(72,129,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
                <span style={{ width: '32px', height: '32px', border: '3px solid rgba(72,129,248,0.3)', borderTop: '3px solid #4881F8', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Verifying Your Email</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Please wait while we verify your email address...</p>
              <div style={{ marginTop: '1.5rem', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="progress-bar" style={{ height: '100%', background: 'linear-gradient(90deg,#4881F8,#6366f1)', borderRadius: '2px' }} />
              </div>
            </div>
          )}

          {/* Verification complete */}
          {verificationComplete && (
            <div style={{ textAlign: 'center' }}>
              <div className="check-anim" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.2))', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Email Verified!</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: '1.5rem' }}>Your email has been verified. Redirecting to login...</p>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="progress-bar" style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#059669)', borderRadius: '2px' }} />
              </div>
            </div>
          )}

          {/* No token — manual verification info */}
          {!hasToken && !verificationComplete && (
            <>
              <div className="env-anim" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(72,129,248,0.2),rgba(99,102,241,0.2))', border: '1px solid rgba(72,129,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
                <Mail size={28} color="#4881F8" />
              </div>
              <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>Verify Your Email</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                We've sent a verification link to your email address. Click the link to verify your account.
              </p>

              {!showResendForm ? (
                <button onClick={() => setShowResendForm(true)} className="ev-outline" id="resend-toggle-btn">
                  Didn't receive the email?
                </button>
              ) : (
                <form onSubmit={handleResendVerification}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                        placeholder="Enter your email" required
                        style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.8rem', boxSizing: 'border-box', background: focused ? 'rgba(72,129,248,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${focused ? 'rgba(72,129,248,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(72,129,248,0.15)' : 'none', transition: 'all 0.2s' }} />
                    </div>
                  </div>
                  <button type="submit" className="ev-btn" id="resend-submit-btn" disabled={isLoading}>
                    {isLoading ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Sending...</> : <><RefreshCw size={16} /> Resend Verification Email</>}
                  </button>
                </form>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/login" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#4881F8'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;