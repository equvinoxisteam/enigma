import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestLogin = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState({
    tokenBefore: null,
    userBefore: null,
    tokenAfter: null,
    userAfter: null,
    loginAttempted: false,
    loginSuccess: false,
    error: null
  });

  const testDirectLogin = async () => {
    console.log('🧪 Starting direct login test...');
    
    // Clear storage first
    localStorage.clear();
    setTestResults(prev => ({ ...prev, tokenBefore: null, userBefore: null }));
    
    try {
      const response = await fetch('http://localhost:5005/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Test123!'
        })
      });

      const data = await response.json();
      console.log('📦 Login response:', data);

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        
        setTestResults(prev => ({
          ...prev,
          loginAttempted: true,
          loginSuccess: true,
          tokenAfter: data.token,
          userAfter: JSON.stringify(data, null, 2)
        }));

        console.log('✅ Direct login successful!');
        console.log('🔑 Token:', data.token.substring(0, 30) + '...');
        
        // Try to navigate
        setTimeout(() => {
          console.log('🚀 Attempting navigation to /dashboard');
          navigate('/dashboard');
        }, 1000);
      } else {
        setTestResults(prev => ({
          ...prev,
          loginAttempted: true,
          loginSuccess: false,
          error: data.message || 'No token received'
        }));
        console.error('❌ Login failed:', data.message);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        loginAttempted: true,
        loginSuccess: false,
        error: error.message
      }));
      console.error('💥 Test error:', error);
    }
  };

  useEffect(() => {
    // Check initial state
    setTestResults(prev => ({
      ...prev,
      tokenBefore: localStorage.getItem('token'),
      userBefore: localStorage.getItem('user')
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Direct Login Test</h1>
        
        {/* Before State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Before Login</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Token:</strong> {testResults.tokenBefore ? '✅ Exists' : '❌ Missing'}</p>
            <p><strong>User:</strong> {testResults.userBefore ? '✅ Exists' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Test Button */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔬 Test Direct API Login</h2>
          <p className="mb-4 text-sm">
            This will attempt a direct login using fetch API (bypassing Redux/AuthContext)
            to verify if the backend is working correctly.
          </p>
          <button
            onClick={testDirectLogin}
            disabled={testResults.loginAttempted}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testResults.loginAttempted ? 'Test Already Run' : 'Run Direct Login Test'}
          </button>
          <p className="mt-2 text-xs text-gray-600">
            Uses credentials: test@example.com / Test123!
          </p>
        </div>

        {/* Results */}
        {testResults.loginAttempted && (
          <>
            <div className={`rounded-lg shadow p-6 mb-6 ${
              testResults.loginSuccess ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
            }`}>
              <h2 className="text-xl font-semibold mb-4">
                {testResults.loginSuccess ? '✅ Login Successful' : '❌ Login Failed'}
              </h2>
              {testResults.error && (
                <p className="text-red-600 mb-4">{testResults.error}</p>
              )}
              <div className="space-y-2 text-sm">
                <p><strong>Response Token:</strong> {testResults.tokenAfter ? '✅ Received' : '❌ Not received'}</p>
                <p><strong>Saved to Storage:</strong> {testResults.tokenAfter ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            {testResults.tokenAfter && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">🔑 Token Details</h2>
                <div className="space-y-2 text-sm break-all">
                  <p><strong>Token Length:</strong> {testResults.tokenAfter.length} characters</p>
                  <p><strong>Token Start:</strong> {testResults.tokenAfter.substring(0, 50)}...</p>
                  <p><strong>Token End:</strong> ...{testResults.tokenAfter.substring(testResults.tokenAfter.length - 20)}</p>
                </div>
              </div>
            )}

            {testResults.userAfter && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">👤 User Data Saved</h2>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                  {testResults.userAfter}
                </pre>
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">⚠️ Next Steps</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open browser DevTools (F12)</li>
                <li>Check Console tab for detailed logs</li>
                <li>Check Network tab for API requests</li>
                <li>If token was saved but still redirects → ProtectedRoute issue</li>
                <li>If no token → Backend authentication issue</li>
              </ol>
            </div>
          </>
        )}

        {/* Manual Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧭 Manual Navigation Test</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/debug')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Debug Page
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
