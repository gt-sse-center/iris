import React, { useState } from 'react';

interface LoginFormProps {
  onSuccess?: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
}

type FormMode = 'login' | 'register' | 'forgot-password';

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Forgot password mode
    if (mode === 'forgot-password') {
      if (!username.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/user/request-password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          setError(responseText || 'Password reset request failed');
          setLoading(false);
          return;
        }

        setSuccess(responseText);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Password reset request failed');
        setLoading(false);
      }
      return;
    }

    // Validation for login/register
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
    if (mode === 'register') {
      if (password !== passwordAgain) {
        setError('The passwords are not identical!');
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      // Simple email validation
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(email)) {
        setError('Invalid email format');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === 'login' ? '/user/login' : '/user/register';
      const body = mode === 'login' 
        ? { username, password }
        : { username, password, email };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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

  const switchMode = (newMode: FormMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setUsername('');
    setPassword('');
    setPasswordAgain('');
    setEmail('');
  };

  return (
    <div className="dialogue" style={{ display: 'block' }}>
      <div className="dialogue-content">
        <div className="dialogue-header">
          <h2>
            {mode === 'login' && 'Login'}
            {mode === 'register' && 'Register'}
            {mode === 'forgot-password' && 'Forgot Password'}
          </h2>
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
                      id={`${mode}-username`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </td>
                </tr>
                {mode !== 'forgot-password' && (
                  <tr>
                    <td><b>Password:</b></td>
                    <td>
                      <input
                        type="password"
                        id={`${mode}-password`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </td>
                  </tr>
                )}
                {mode === 'register' && (
                  <>
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
                    <tr>
                      <td><b>Email:</b></td>
                      <td>
                        <input
                          type="email"
                          id="register-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          placeholder="your@email.com"
                        />
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            
            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Request Reset'}
            </button>
            
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => switchMode('register')} disabled={loading}>
                  I have no account yet
                </button>
                <button type="button" onClick={() => switchMode('forgot-password')} disabled={loading}>
                  Forgot Password?
                </button>
              </>
            )}
            
            {mode === 'register' && (
              <button type="button" onClick={() => switchMode('login')} disabled={loading}>
                I have already an account
              </button>
            )}
            
            {mode === 'forgot-password' && (
              <button type="button" onClick={() => switchMode('login')} disabled={loading}>
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
