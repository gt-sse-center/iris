import React from 'react';

/**
 * Band Selector Component
 * 
 * Multi-select dropdown for choosing image bands.
 * Used in the dual-listbox band selection interface.
 */
interface BandSelectorProps {
  bands: string[];
  onSelectionChange: (selected: string[]) => void;
  id?: string;
}

const BandSelector: React.FC<BandSelectorProps> = ({ 
  bands, 
  onSelectionChange, 
  id = 'bands-selector' 
}) => {
  return (
    <select
      id={id}
      size={10}
      multiple
      style={{ width: '125px', height: '200px' }}
      onChange={(e) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
        onSelectionChange(selected);
      }}
    >
      {bands.map(band => (
        <option key={band} value={band}>
          {band}
        </option>
      ))}
    </select>
  );
};

export default BandSelector;
