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
                <p>
                  <button onClick={handleLogout}>Logout</button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
