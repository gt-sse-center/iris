import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ 
  isOpen, 
  title = "Error", 
  message, 
  onClose 
}) => {
  console.log('[IRIS] ErrorModal render:', { isOpen, title, message });
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 10000 
    }}>
      <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        minWidth: '300px'
      }}>
        <div className="modal-header" style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderBottom: '1px solid #f5c6cb',
          padding: '15px 20px',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="modal-close" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#721c24'
          }}>×</button>
        </div>
        <div className="modal-body" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '20px'
        }}>
          <div className="error-icon" style={{
            fontSize: '2rem',
            flexShrink: 0
          }}>⚠️</div>
          <p style={{
            margin: 0,
            lineHeight: 1.4,
            color: '#333'
          }}>{message}</p>
        </div>
        <div className="modal-footer" style={{
          padding: '15px 20px',
          textAlign: 'right',
          borderTop: '1px solid #dee2e6'
        }}>
          <button className="btn btn-primary" onClick={onClose} style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white'
          }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;