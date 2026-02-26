import React from 'react';
import ToolButton from './toolbar/ToolButton';
import PaintbrushSelector from './toolbar/PaintbrushSelector';
import { useSegmentationStore } from '../../stores/segmentationStore';

interface LeftToolbarProps {
  onResetMask: () => void;
}

const LeftToolbar: React.FC<LeftToolbarProps> = ({ onResetMask }) => {
  const { 
    currentTool, 
    setCurrentTool, 
    predictMask, 
    resetViews, 
    isLoading,
    showErrorModal 
  } = useSegmentationStore();
  
  const handlePredictMask = async () => {
    try {
      await predictMask();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorModal(errorMessage, 'AI Prediction Error');
    }
  };

  const handleResetViews = () => {
    resetViews();
  };

  const handleUndo = () => {
    const w = window as any;
    if (w.undo) w.undo();
  };

  const handleRedo = () => {
    const w = window as any;
    if (w.redo) w.redo();
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: '50px',
        bottom: '60px',
        width: '60px',
        backgroundColor: '#34495e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        gap: '5px',
        zIndex: 900,
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        overflowY: 'auto',
        listStyle: 'none',
      }}
    >
      {/* Drawing Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', listStyle: 'none' }}>
        <ToolButton
          id="tb_tool_move"
          icon="/segmentation/static/icons/move.png"
          checked={currentTool === 'move'}
          onClick={() => setCurrentTool('move')}
          disabled={isLoading}
          title="Move/Pan"
        />
        
        <PaintbrushSelector
          id="tb_tool_draw"
          icon="/segmentation/static/icons/pencil.png"
          checked={currentTool === 'draw'}
          onClick={() => setCurrentTool('draw')}
          disabled={isLoading}
          title="Draw pixels"
          dropdownType="draw"
        />
        
        <PaintbrushSelector
          id="tb_tool_eraser"
          icon="/segmentation/static/icons/eraser.png"
          checked={currentTool === 'eraser'}
          onClick={() => setCurrentTool('eraser')}
          disabled={isLoading}
          title="Erase pixels"
          dropdownType="eraser"
        />
      </div>

      {/* Separator */}
      <div style={{ width: '80%', height: '1px', backgroundColor: '#7f8c8d', margin: '5px 0' }} />

      {/* Editing Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', listStyle: 'none' }}>
        <ToolButton
          id="tb_undo"
          icon="/segmentation/static/icons/undo.png"
          onClick={handleUndo}
          title="Undo"
        />
        
        <ToolButton
          id="tb_redo"
          icon="/segmentation/static/icons/redo.png"
          onClick={handleRedo}
          title="Redo"
        />
      </div>

      {/* Separator */}
      <div style={{ width: '80%', height: '1px', backgroundColor: '#7f8c8d', margin: '5px 0' }} />

      {/* AI & Reset Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', listStyle: 'none' }}>
        <ToolButton
          id="tb_predict_mask"
          icon="/segmentation/static/icons/ai.png"
          onClick={handlePredictMask}
          disabled={isLoading}
          title={isLoading ? "Predicting..." : "Predict mask using AI"}
        />
        
        <ToolButton
          id="tb_reset_mask"
          icon="/segmentation/static/icons/reset_mask.png"
          onClick={onResetMask}
          disabled={isLoading}
          title="Reset mask"
        />
        
        <ToolButton
          id="tb_tool_reset_views"
          icon="/segmentation/static/icons/reset_views.png"
          onClick={handleResetViews}
          disabled={isLoading}
          title="Reset views"
        />
      </div>
    </div>
  );
};

export default LeftToolbar;
