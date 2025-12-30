import React, { useEffect } from 'react';
import { useSegmentationStore } from '../stores/segmentationStore';

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Class Selection Modal Component
 * 
 * Displays an overview of all segmentation classes with their colors,
 * descriptions, and pixel counts. Allows users to select a class for drawing.
 */
const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ isOpen, onClose }) => {
  // PHASE 1: Use store hooks instead of direct window.vars access
  const { classes, userPixelCounts, currentClass, setCurrentClass } = useSegmentationStore();
  
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

  const handleClassSelect = (index: number) => {
    setCurrentClass(index);
    onClose();
  };

  const rgba2css = (colour: number[]) => {
    if (!colour || colour.length < 4) return 'rgba(128, 128, 128, 1)';
    return `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${colour[3] / 255})`;
  };

  return (
    <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="class-selection-modal">
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>
            &times;
          </span>
          <h2>Class selection</h2>
        </div>
        <div className="dialogue-body">
          <div className="dialogue-info">
            <p>Here is an overview about all classes:</p>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Drawn pixels by user</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem, index) => (
                  <tr key={index}>
                    <td>
                      <button
                        style={{
                          backgroundColor: rgba2css(classItem.colour),
                          width: '100%',
                          padding: '8px 16px',
                          border: currentClass === index ? '2px solid #000' : '1px solid #ccc',
                          cursor: 'pointer',
                          fontWeight: currentClass === index ? 'bold' : 'normal'
                        }}
                        onClick={() => handleClassSelect(index)}
                      >
                        {classItem.name}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {userPixelCounts[index] || 0}
                    </td>
                    <td>{classItem.description || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassSelectionModal;
