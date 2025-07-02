import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, AlertCircle, Eye, EyeOff, Mail, Lock, User, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword, validateEmail } from '../../lib/supabase';
import { Avatar } from '../UI/Avatar';
import { LandingPage } from '../Landing/LandingPage';

export const AuthForm: React.FC = () => {
  const { signIn, signUp, resetPassword, loading, error } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Name validation (for signup)
    if (!isLogin && !formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (!isLogin && formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0]; // Show first error
      }
    }

    // Confirm password validation (for signup)
    if (!isLogin) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setFormErrors({ submit: error });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          setFormErrors({ submit: error });
        }
      }
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'An unexpected error occurred' });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setFormErrors({ email: 'Please enter your email address' });
      return;
    }

    if (!validateEmail(formData.email)) {
      setFormErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      const { error } = await resetPassword(formData.email);
      if (error) {
        setFormErrors({ submit: error });
      } else {
        setResetEmailSent(true);
        setFormErrors({});
      }
    } catch (err: any) {
      setFormErrors({ submit: err.message || 'Password reset failed' });
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setIsResettingPassword(false);
    setResetEmailSent(false);
    setFormErrors({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setPasswordValidation({ isValid: false, errors: [] });
  };

  const handleResetModeSwitch = () => {
    setIsResettingPassword(!isResettingPassword);
    setResetEmailSent(false);
    setFormErrors({});
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setIsLogin(false); // Default to signup for new users
  };

  const handleBackToLanding = () => {
    setShowLanding(true);
    setFormErrors({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  // Show landing page by default
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-green-50 border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{formData.email}</strong>. 
              Click the link in the email to reset your password.
            </p>
            <button
              onClick={() => {
                setResetEmailSent(false);
                setIsResettingPassword(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="w-full bg-[#F8D380] text-gray-900 py-3 px-4 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Back to Landing Button */}
          <button
            onClick={handleBackToLanding}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-50 to-purple-50">
              <img 
                src="/Untitled design-7.png" 
                alt="CISSP Study Group" 
                className="w-12 h-12 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CISSP Study Group</h1>
            <p className="text-gray-600 mt-2">
              {isResettingPassword 
                ? 'Reset your password' 
                : isLogin 
                ? 'Welcome back! Sign in to continue.' 
                : 'Join our study leader community.'
              }
            </p>
            
            {/* Preview avatar for signup */}
            {!isLogin && !isResettingPassword && formData.email && (
              <div className="mt-4 flex flex-col items-center space-y-2">
                <p className="text-sm text-gray-600">Your avatar will be:</p>
                <Avatar 
                  user={{ email: formData.email, name: formData.name }} 
                  size="lg"
                />
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={isResettingPassword ? handlePasswordReset : handleSubmit} className="space-y-6">
            {!isLogin && !isResettingPassword && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {formErrors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {!isResettingPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {formErrors.password}
                  </p>
                )}
                
                {/* Password strength indicator for signup */}
                {!isLogin && formData.password && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-2">Password Requirements:</div>
                    <div className="space-y-1">
                      {[
                        { test: formData.password.length >= 8, text: 'At least 8 characters' },
                        { test: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
                        { test: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
                        { test: /\d/.test(formData.password), text: 'One number' },
                        { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password), text: 'One special character' }
                      ].map((req, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {req.test ? (
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="w-3 h-3 text-gray-300 mr-2" />
                          )}
                          <span className={req.test ? 'text-green-600' : 'text-gray-500'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLogin && !isResettingPassword && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {(formErrors.submit || error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{formErrors.submit || error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F8D380] text-gray-900 py-3 px-4 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isResettingPassword ? (
                    <Mail className="w-5 h-5" />
                  ) : isLogin ? (
                    <LogIn className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  <span>
                    {isResettingPassword 
                      ? 'Send Reset Link' 
                      : isLogin 
                      ? 'Sign In' 
                      : 'Create Account'
                    }
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Links */}
          <div className="mt-6 text-center space-y-2">
            {!isResettingPassword ? (
              <>
                <button
                  onClick={handleModeSwitch}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
                {isLogin && (
                  <div>
                    <button
                      onClick={handleResetModeSwitch}
                      className="text-gray-600 hover:text-gray-700 text-sm"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleResetModeSwitch}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Back to Sign In
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">Secure Platform</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Your account is protected with industry-standard security measures including encrypted passwords, 
              secure authentication, and automatic session management. Each user gets a unique animal avatar!
            </p>
          </div>

          {/* Features */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Platform Features:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>AI-powered question generation and explanations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Comprehensive question bank management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Practice questions for screen sharing sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>AI assistant for concept explanations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};