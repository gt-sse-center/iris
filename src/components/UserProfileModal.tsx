import React, { useEffect, useState } from 'react';
import type { UserProfile } from '../types/iris';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId = 'current'
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/user/api/profile/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to load profile: ${response.statusText}`);
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/user/logout');
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Failed to logout');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validation
    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/user/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordForm(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleImageClick = (imageId: string) => {
    // Call legacy JavaScript function to navigate to image
    if (typeof (window as any).goto_image === 'function') {
      if (typeof (window as any).save_mask === 'function') {
        (window as any).save_mask();
      }
      (window as any).goto_image('segmentation', imageId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialogue" style={{ display: 'block' }}>
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>&times;</span>
          <h2>User information</h2>
        </div>
        <div className="dialogue-body">
          {loading && <p>Loading profile...</p>}
          
          {error && (
            <div>
              <p className="tag red">{error}</p>
              <button onClick={onClose}>Close</button>
            </div>
          )}
          
          {profile && (
            <>
              <h2 style={{ marginBottom: '-20px' }}>{profile.name}</h2>
              <div style={{ marginBottom: '10px', textAlign: 'right' }}>
                {profile.is_current_user && <span className="tag" style={{ marginRight: '5px' }}>this is you</span>}
                {profile.admin && <span className="tag green" style={{ marginRight: '5px' }}>admin</span>}
                {profile.tested ? (
                  <span className="tag green">tested</span>
                ) : (
                  <span className="tag red">not tested</span>
                )}
              </div>
              <p></p>

              <div
                className={`accordion ${accordionOpen ? 'checked' : ''}`}
                onClick={() => setAccordionOpen(!accordionOpen)}
              >
                Segmentation
              </div>
              
              <div className="panel" style={{ display: accordionOpen ? 'block' : 'none' }}>
                <h3>Stats</h3>
                <table style={{ width: '40%' }}>
                  <tbody>
                    <tr>
                      <td>Rank:</td>
                      <td>{profile.segmentation.rank ?? 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Score:</td>
                      <td>{profile.segmentation.score}</td>
                    </tr>
                    <tr>
                      <td>Unverified score:</td>
                      <td>{profile.segmentation.score_unverified}</td>
                    </tr>
                    <tr>
                      <td>Labelled images:</td>
                      <td>{profile.segmentation.n_masks}</td>
                    </tr>
                  </tbody>
                </table>

                {profile.segmentation.last_masks && profile.segmentation.last_masks.length > 0 && (
                  <>
                    <h3>Last segmentation masks</h3>
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Score</th>
                          <th>Last modification</th>
                          <th>Time spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.segmentation.last_masks.map((mask, idx) => (
                          <tr key={idx}>
                            <td>
                              <button onClick={() => handleImageClick(mask.image_id)}>
                                {mask.image_id}
                              </button>
                            </td>
                            <td>
                              {mask.score}
                              {mask.score_unverified && <span className="tag">unverified</span>}
                            </td>
                            <td>{mask.last_modification}</td>
                            <td>{mask.time_spent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {profile.is_current_user && (
                <>
                  {!showPasswordForm ? (
                    <p>
                      <button onClick={() => setShowPasswordForm(true)}>Change Password</button>
                      <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
                    </p>
                  ) : (
                    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <h3>Change Password</h3>
                      
                      {passwordError && (
                        <p className="tag red" style={{ marginBottom: '10px' }}>{passwordError}</p>
                      )}
                      
                      {passwordSuccess && (
                        <p className="tag green" style={{ marginBottom: '10px' }}>{passwordSuccess}</p>
                      )}
                      
                      <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: '10px' }}>
                          <label htmlFor="current-password" style={{ display: 'block', marginBottom: '5px' }}>
                            Current Password:
                          </label>
                          <input
                            id="current-password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            disabled={changingPassword}
                            style={{ width: '100%', padding: '5px' }}
                          />
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                          <label htmlFor="new-password" style={{ display: 'block', marginBottom: '5px' }}>
                            New Password (min 4 characters):
                          </label>
                          <input
                            id="new-password"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            disabled={changingPassword}
                            style={{ width: '100%', padding: '5px' }}
                          />
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '5px' }}>
                            Confirm New Password:
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            disabled={changingPassword}
                            style={{ width: '100%', padding: '5px' }}
                          />
                        </div>
                        
                        <div>
                          <button type="submit" disabled={changingPassword}>
                            {changingPassword ? 'Changing...' : 'Change Password'}
                          </button>
                          <button 
                            type="button" 
                            onClick={handleCancelPasswordChange}
                            disabled={changingPassword}
                            style={{ marginLeft: '10px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
