import React, { useState } from 'react';

interface LoginFormProps {
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
}

type FormMode = 'login' | 'register';

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (username.length > 64) {
      setError('Username is too long (max 64 characters)');
      setLoading(false);
      return;
    }
    if (password.length > 64) {
      setError('Password is too long (max 64 characters)');
      setLoading(false);
      return;
    }

    // Register mode validation
    if (mode === 'register' && password !== passwordAgain) {
      setError('The passwords are not identical!');
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? '/user/login' : '/user/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        setError(responseText || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
        setLoading(false);
        return;
      }

      // Success - reload page or call callback
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode === 'login' ? 'Login' : 'Registration'} failed`);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setUsername('');
    setPassword('');
    setPasswordAgain('');
  };

  return (
    <div className="dialogue" style={{ display: 'block' }}>
      <div className="dialogue-content">
        <div className="dialogue-header">
          <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
        </div>
        <div className="dialogue-body">
          <form onSubmit={handleSubmit}>
            <table style={{ border: '0px' }}>
              <tbody>
                <tr>
                  <td><b>Username:</b></td>
                  <td>
                    <input
                      type="text"
                      id={mode === 'login' ? 'login-username' : 'register-username'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </td>
                </tr>
                <tr>
                  <td><b>Password:</b></td>
                  <td>
                    <input
                      type="password"
                      id={mode === 'login' ? 'login-password' : 'register-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </td>
                </tr>
                {mode === 'register' && (
                  <tr>
                    <td><b>Retype Password:</b></td>
                    <td>
                      <input
                        type="password"
                        id="register-password-again"
                        value={passwordAgain}
                        onChange={(e) => setPasswordAgain(e.target.value)}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
            <button type="button" onClick={toggleMode} disabled={loading}>
              {mode === 'login' ? 'I have no account yet' : 'I have already an account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
