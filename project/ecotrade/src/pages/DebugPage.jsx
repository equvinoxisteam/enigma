import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DebugPage = () => {
  const navigate = useNavigate();
  const [localStorageData, setLocalStorageData] = useState({});
  const [parsedUser, setParsedUser] = useState(null);

  useEffect(() => {
    // Get all localStorage items
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    setLocalStorageData(data);

    // Try to parse user
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setParsedUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug Page</h1>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Profile
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Login
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                alert('LocalStorage cleared!');
                setLocalStorageData({});
                setParsedUser(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear LocalStorage
            </button>
          </div>
        </div>

        {/* Token Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔑 Token Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Token exists:</strong>{' '}
              <span className={localStorage.getItem('token') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {localStorage.getItem('token') ? 'YES ✅' : 'NO ❌'}
              </span>
            </p>
            <p>
              <strong>Token value:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded block mt-2 break-all">
                {localStorage.getItem('token') || 'No token found'}
              </code>
            </p>
          </div>
        </div>

        {/* User Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 User Data</h2>
          <div className="space-y-2">
            <p>
              <strong>User string exists:</strong>{' '}
              <span className={localStorage.getItem('user') ? 'text-green-600' : 'text-red-600'}>
                {localStorage.getItem('user') ? 'YES ✅' : 'NO ❌'}
              </span>
            </p>
            {parsedUser && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <strong>Full Name:</strong> {parsedUser.fullName}
                </div>
                <div>
                  <strong>Email:</strong> {parsedUser.email}
                </div>
                <div>
                  <strong>User Type:</strong> {parsedUser.userType}
                </div>
                <div>
                  <strong>Company:</strong> {parsedUser.companyName}
                </div>
                <div>
                  <strong>Has Token in User:</strong>{' '}
                  <span className={parsedUser.token ? 'text-green-600' : 'text-red-600'}>
                    {parsedUser.token ? 'YES ✅' : 'NO ❌'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All LocalStorage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">💾 Complete LocalStorage</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify(localStorageData, null, 2)}
          </pre>
        </div>

        {/* Parsed User Object */}
        {parsedUser && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📋 Parsed User Object</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(parsedUser, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚠️ Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>If token is missing → Login is not storing token properly</li>
            <li>If user data is missing → Check authAPI.js login function</li>
            <li>If both exist but still redirecting → Check ProtectedRoute logic</li>
            <li>Click "Clear LocalStorage" then login again to test fresh</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
