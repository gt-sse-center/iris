import React, { useEffect, useState } from 'react';

interface ImageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageMetadata {
  [key: string]: string | number;
}

/**
 * Image Info Modal Component
 * 
 * Displays image thumbnail and metadata information.
 * Fetches metadata from the server and shows it in a table format.
 */
const ImageInfoModal: React.FC<ImageInfoModalProps> = ({ isOpen, onClose }) => {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchMetadata = async () => {
        const w = window as any;
        const imageId = w.vars?.image_id;
        const mainUrl = w.vars?.url?.main;

        if (!imageId || !mainUrl) {
          setError('Image ID not available');
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response = await fetch(`${mainUrl}metadata/${imageId}?safe_html=True`);
          
          if (response.status >= 400) {
            const errorText = await response.text();
            setError(errorText);
          } else {
            const data = await response.json();
            setMetadata(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load metadata');
        } finally {
          setLoading(false);
        }
      };

      fetchMetadata();
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
          onClose();
          event.preventDefault();
          event.stopPropagation();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const w = window as any;
  const imageId = w.vars?.image_id || 'Unknown';
  const mainUrl = w.vars?.url?.main || '';

  return (
    <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="image-info-modal">
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>
            &times;
          </span>
          <h2>image: {imageId}</h2>
        </div>
        <div className="dialogue-body">
          <div className="dialogue-info">
            {/* Thumbnail */}
            <p>
              <img 
                src={`${mainUrl}thumbnail/${imageId}?size=256x256`}
                alt={`Thumbnail of ${imageId}`}
                style={{ 
                  display: 'block', 
                  marginLeft: 'auto', 
                  marginRight: 'auto',
                  maxWidth: '256px',
                  maxHeight: '256px'
                }}
              />
            </p>

            {/* Metadata */}
            <div style={{ float: 'left', width: '100%' }}>
              {loading && <p>Loading metadata...</p>}
              
              {error && <p style={{ color: '#d32f2f' }}>{error}</p>}
              
              {metadata && (
                <table>
                  <tbody>
                    {Object.entries(metadata).map(([key, value]) => (
                      <tr key={key}>
                        <td><b>{key}</b></td>
                        <td>
                          {key === 'location' ? (
                            <>
                              {String(value)}{' '}
                              <a 
                                target="_blank" 
                                rel="noopener noreferrer"
                                href={`https://www.google.com/maps/search/?api=1&query=${String(value).replace('[', '').replace(']', '').replace(' ', '')}`}
                              >
                                Show on map
                              </a>
                            </>
                          ) : (
                            String(value)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageInfoModal;
