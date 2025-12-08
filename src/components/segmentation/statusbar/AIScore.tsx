import React from 'react';

interface AIScoreProps {
  onOpenConfusionMatrix: () => void;
}

const AIScore: React.FC<AIScoreProps> = ({ onOpenConfusionMatrix }) => {
  return (
    <div className="statusbutton" onClick={onOpenConfusionMatrix}>
      <div id="ai-score" className="info-box-top">0</div>
      <div className="info-box-bottom">AI-Score</div>
    </div>
  );
};

export default AIScore;
