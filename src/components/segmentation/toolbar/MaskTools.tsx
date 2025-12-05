import React from 'react';
import ToolButton from './ToolButton';

const MaskTools: React.FC = () => {
  return (
    <>
      <ToolButton
        id="tb_toggle_mask"
        icon="/segmentation/static/icons/show_mask.png"
        onClick={() => {
          const w = window as any;
          if (w.vars && w.show_mask) {
            w.show_mask(!w.vars.show_mask);
          }
        }}
      />
      <ToolButton
        id="tb_mask_final"
        icon="/segmentation/static/icons/mask_final.png"
        onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('final');
        }}
      />
      <ToolButton
        id="tb_mask_user"
        icon="/segmentation/static/icons/mask_user.png"
        onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('user');
        }}
      />
      <ToolButton
        id="tb_mask_errors"
        icon="/segmentation/static/icons/mask_errors.png"
        onClick={() => {
          const w = window as any;
          if (w.set_mask_type) w.set_mask_type('errors');
        }}
      />
    </>
  );
};

export default MaskTools;
