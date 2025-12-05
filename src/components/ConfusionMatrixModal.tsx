import React, { useEffect } from 'react';

interface ConfusionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Confusion Matrix Modal Component
 * 
 * Displays the AI model's confusion matrix showing prediction accuracy
 * across different classes. Shows real vs predicted class performance.
 */
const ConfusionMatrixModal: React.FC<ConfusionMatrixModalProps> = ({ isOpen, onClose }) => {
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

  // Get confusion matrix and classes from window.vars
  const w = window as any;
  const confusionMatrix = w.vars?.confusion_matrix;
  const classes = w.vars?.classes || [];

  // Format numbers nicely (from legacy nice_number function)
  const niceNumber = (num: number): string => {
    if (num === null || num === undefined) return '0';
    if (num < 1000) return num.toFixed(0);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
    return (num / 1000000).toFixed(1) + 'M';
  };

  // Check if AI has been trained
  if (!confusionMatrix) {
    return (
      <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="confusion-matrix-modal">
        <div className="dialogue-content">
          <div className="dialogue-header">
            <span className="dialogue-close" onClick={onClose}>
              &times;
            </span>
            <h2>Confusion Matrix</h2>
          </div>
          <div className="dialogue-body">
            <div className="dialogue-info">
              <p>You need to train the AI first before you can see a confusion matrix</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="confusion-matrix-modal">
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>
            &times;
          </span>
          <h2>Confusion Matrix</h2>
        </div>
        <div className="dialogue-body">
          <div className="dialogue-info">
            <table className="confusion-matrix" style={{ float: 'left' }}>
              <thead>
                <tr className="first">
                  <td className="upper-left">Real / Prediction</td>
                  {classes.map((classItem: any, index: number) => (
                    <td key={index} className="first">
                      {classItem.name}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row: number[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    <td className="first">{classes[rowIndex]?.name || ''}</td>
                    {row.map((value: number, colIndex: number) => (
                      <td key={colIndex}>{niceNumber(value)}</td>
                    ))}
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

export default ConfusionMatrixModal;
