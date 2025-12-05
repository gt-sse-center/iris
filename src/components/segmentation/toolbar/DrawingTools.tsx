import React from 'react';
import ToolButton from './ToolButton';

interface DrawingToolsProps {
  onResetMask: () => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ onResetMask }) => {
  return (
    <>
      <ToolButton
        id="tb_tool_move"
        icon="/segmentation/static/icons/move.png"
        onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('move');
        }}
      />
      <ToolButton
        id="tb_tool_reset_views"
        icon="/segmentation/static/icons/reset_views.png"
        onClick={() => {
          const w = window as any;
          if (w.reset_views) w.reset_views();
        }}
      />
      <ToolButton
        id="tb_tool_draw"
        icon="/segmentation/static/icons/pencil.png"
        onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('draw');
        }}
      />
      <ToolButton
        id="tb_tool_eraser"
        icon="/segmentation/static/icons/eraser.png"
        onClick={() => {
          const w = window as any;
          if (w.set_tool) w.set_tool('eraser');
        }}
      />
      <ToolButton
        id="tb_reset_mask"
        icon="/segmentation/static/icons/reset_mask.png"
        onClick={onResetMask}
      />
      <ToolButton
        id="tb_predict_mask"
        icon="/segmentation/static/icons/ai.png"
        onClick={() => {
          const w = window as any;
          if (w.predict_mask) w.predict_mask();
        }}
      />
    </>
  );
};

export default DrawingTools;
