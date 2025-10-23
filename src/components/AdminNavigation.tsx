import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === '/users') return location.pathname === '/users';
    if (path === '/images') return location.pathname === '/images';
    if (path === '/actions') return location.pathname.startsWith('/actions');
    return false;
  };

  const buttonStyle = (path: string): React.CSSProperties => ({
    backgroundColor: isActive(path) ? '#ddd' : 'transparent',
    border: '1px solid #ccc',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px'
  });

  return (
    <div className="tab" style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
      <button 
        style={buttonStyle('/users')}
        onClick={() => navigate('/users')}
      >
        Users
      </button>
      <button 
        style={buttonStyle('/images')}
        onClick={() => navigate('/images')}
      >
        Images
      </button>
      <button 
        style={buttonStyle('/actions')}
        onClick={() => navigate('/actions/segmentation')}
      >
        Masks
      </button>
    </div>
  );
};

export default AdminNavigation;