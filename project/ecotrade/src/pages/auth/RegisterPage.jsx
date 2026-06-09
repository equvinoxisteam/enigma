import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, clearSuccessMessage } from '../../store/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import { Mail, Lock, User, UserPlus, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { isLoading } = useSelector((state) => state.auth);
  const isSubmitting = useRef(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    isSubmitting.current = false;
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;
    dispatch(clearError());
    dispatch(clearSuccessMessage());

    if (!validateForm()) {
      isSubmitting.current = false;
      return;
    }

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        
        // Navigate after showing success message
        setTimeout(() => {
          navigate('/verify-email', {
            state: {
              email: formData.email,
              message: result.message || 'Registration successful! Please check your email to verify your account.',
            },
          });
        }, 1000);
      } else {
        // Show error toast
        showError(result.error || 'Registration failed. Please try again.');
        console.error('Registration failed:', result.error);
        isSubmitting.current = false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      showError('Registration failed. Please try again.');
      isSubmitting.current = false;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="mb-6" style={{ textAlign: 'center' }}>
              <img src="/indianet png.png" alt="Enigma" style={{ height: '48px', width: 'auto', filter: 'brightness(1.0)', margin: '0 auto' }} />
            </div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Create Account</h1>
              <p className="text-gray-600">Join Reeown and start shopping for premium refurbished devices today</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  leftIcon={<User className="h-5 w-5" />}
                  placeholder="Enter your full name"
                  fullWidth
                  required
                  error={validationErrors.name}
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  leftIcon={<Mail className="h-5 w-5" />}
                  placeholder="you@example.com"
                  fullWidth
                  required
                  error={validationErrors.email}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  placeholder="Create a strong password"
                  fullWidth
                  required
                  error={validationErrors.password}
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  placeholder="Confirm your password"
                  fullWidth
                  required
                  error={validationErrors.confirmPassword}
                />
              </div>

              {formData.password && (
                <div className="text-sm">
                  <p className="text-gray-600 mb-2">Password strength:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 6 ? 'bg-green-600' : 'bg-gray-300'}`} />
                      <span className="text-xs">At least 6 characters</span>
                    </div>
                    <div className={`flex items-center ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'bg-green-600' : 'bg-gray-300'}`} />
                      <span className="text-xs">Upper and lowercase letters</span>
                    </div>
                    <div className={`flex items-center ${/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*\d)/.test(formData.password) ? 'bg-green-600' : 'bg-gray-300'}`} />
                      <span className="text-xs">At least one number</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<UserPlus className="h-5 w-5" />}
                isLoading={isLoading}
                disabled={isSubmitting.current}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="font-medium text-green-700 hover:text-emerald-600">
                Sign in instead
              </Link>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you'll receive a verification email to confirm your address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;