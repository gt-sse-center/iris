import React from 'react';

const AIRecommendation: React.FC = () => {
  return (
    <div className="info-box">
      <img style={{ float: 'left' }} src="/segmentation/static/icons/ai.png" />
      <div
        style={{ fontSize: '16px', float: 'left', marginLeft: '10px' }}
        id="ai-recommendation"
      >
        AI is loading
      </div>
    </div>
  );
};

export default AIRecommendation;
