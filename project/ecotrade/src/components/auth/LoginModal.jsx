import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe
      });

      if (result.success) {
        showSuccess('Login successful!');
        setAnimateIn(false);
        setTimeout(() => {
          onClose();
          setFormData({ email: '', password: '' });
          navigate('/dashboard');
          if (onSuccess) onSuccess(result.user);
        }, 300);
      } else {
        showError(result.error || 'Login failed');
      }
    } catch (error) {
      showError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${animateIn ? 'opacity-100 bg-gray-900/60 backdrop-blur-md' : 'opacity-0 bg-transparent'} p-4`}>
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-[420px] w-full overflow-hidden border border-gray-100 transform transition-all duration-300 ease-out ${
          animateIn ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'
        }`}
      >
        {/* Header Section */}
        <div className="relative bg-[#4881F8]/10 px-8 pt-8 pb-6 flex flex-col items-center border-b border-gray-50">
          <button
            onClick={() => {
              setAnimateIn(false);
              setTimeout(onClose, 300);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 hover:bg-white/50 rounded-full p-2 transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4 inline-flex items-center justify-center">
            <img 
              src="/enigma-logo.svg" 
              alt="Enigma Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your Enigma account</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 pt-6">
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4881F8] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border rounded-xl text-sm transition-all focus:ring-2 focus:ring-[#4881F8]/20 focus:border-[#4881F8] outline-none ${
                    errors.email ? 'border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                  }`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/forgot-password');
                  }}
                  className="text-xs font-semibold hover:text-[#3b6fe0] transition-colors"
                  style={{ color: '#4881F8' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#4881F8] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border rounded-xl text-sm transition-all focus:ring-2 focus:ring-[#4881F8]/20 focus:border-[#4881F8] outline-none ${
                    errors.password ? 'border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 mr-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-gray-300 rounded peer checked:bg-[#4881F8] checked:border-[#4881F8] transition-colors cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-[#4881F8]/30"
                  />
                  <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 mr-2 rounded-xl text-white font-bold tracking-wide disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex justify-center items-center"
              style={{ backgroundColor: '#4881F8', boxShadow: '0 4px 14px 0 rgba(72, 129, 248, 0.39)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className="ml-2 -mr-1" />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
              <span className="px-3 bg-white text-gray-400">New to Enigma?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/role-selection');
              }}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              Create an account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
