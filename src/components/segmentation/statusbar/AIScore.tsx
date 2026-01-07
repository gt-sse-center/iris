import React from 'react';
import { useSegmentationStore } from '../../../stores/segmentationStore';

interface AIScoreProps {
  onOpenConfusionMatrix: () => void;
}

const AIScore: React.FC<AIScoreProps> = ({ onOpenConfusionMatrix }) => {
  // Get AI score from confusion matrix in React store
  const confusionMatrix = useSegmentationStore(state => state.confusionMatrix);
  
  // Calculate display score - same as legacy round_number(score*100) + "%"
  const displayScore = confusionMatrix 
    ? Math.round(confusionMatrix.accuracyStats.overall * 100)
    : 0;

  return (
    <div className="statusbutton" onClick={onOpenConfusionMatrix}>
      <div id="ai-score" className="info-box-top">{displayScore}</div>
      <div className="info-box-bottom">AI-Score</div>
    </div>
  );
};

export default AIScore;
