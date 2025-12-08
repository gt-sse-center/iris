import React from 'react';
import ToolButton from './ToolButton';

const FilterTools: React.FC = () => {
  return (
    <>
      <ToolButton
        id="tb_brightness_up"
        icon="/segmentation/static/icons/brightness_up.png"
        onClick={() => {
          const w = window as any;
          if (w.change_brightness) w.change_brightness(true);
        }}
      />
      <ToolButton
        id="tb_brightness_down"
        icon="/segmentation/static/icons/brightness_down.png"
        onClick={() => {
          const w = window as any;
          if (w.change_brightness) w.change_brightness(false);
        }}
      />
      <ToolButton
        id="tb_saturation_up"
        icon="/segmentation/static/icons/saturation_up.png"
        onClick={() => {
          const w = window as any;
          if (w.change_saturation) w.change_saturation(true);
        }}
      />
      <ToolButton
        id="tb_saturation_down"
        icon="/segmentation/static/icons/saturation_down.png"
        onClick={() => {
          const w = window as any;
          if (w.change_saturation) w.change_saturation(false);
        }}
      />
      <ToolButton
        id="tb_toggle_contrast"
        icon="/segmentation/static/icons/contrast.png"
        onClick={() => {
          const w = window as any;
          if (w.vars?.vm?.filters && w.set_contrast) {
            w.set_contrast(!w.vars.vm.filters.contrast);
          }
        }}
      />
      <ToolButton
        id="tb_toggle_invert"
        icon="/segmentation/static/icons/invert.png"
        onClick={() => {
          const w = window as any;
          if (w.vars?.vm?.filters && w.set_invert) {
            w.set_invert(!w.vars.vm.filters.invert);
          }
        }}
      />
      <ToolButton
        id="tb_reset_filters"
        icon="/segmentation/static/icons/reset_filters.png"
        onClick={() => {
          const w = window as any;
          if (w.reset_filters) w.reset_filters();
        }}
      />
    </>
  );
};

export default FilterTools;
