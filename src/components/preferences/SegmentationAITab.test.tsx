import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SegmentationAITab from './SegmentationAITab';
import { UserConfig } from '../../types/iris';

const mockConfig: UserConfig = {
  segmentation: {
    ai_model: {
      bands: ['B1', 'B2'],
      n_estimators: 100,
      n_leaves: 31,
      max_depth: -1,
      train_ratio: 0.8,
      max_train_pixels: 10000,
      suppression_threshold: 0.5,
      suppression_filter_size: 5,
      suppression_default_class: 0,
      use_edge_filter: false,
      use_meshgrid: false,
      meshgrid_cells: '5x5',
      use_superpixels: false,
    },
  },
  classes: [
    { name: 'Class 1', css_colour: '#ff0000', colour: [255, 0, 0] },
    { name: 'Class 2', css_colour: '#00ff00', colour: [0, 255, 0] },
  ],
};

describe('SegmentationAITab', () => {
  it('renders the AI configuration sections', () => {
    render(
      <SegmentationAITab
        config={mockConfig}
        allBands={['B1', 'B2', 'B3', 'B4']}
        updateAIModelConfig={vi.fn()}
        moveBands={vi.fn()}
      />
    );

    expect(screen.getByText('Model Parameters')).toBeInTheDocument();
    expect(screen.getByText('Postprocessing')).toBeInTheDocument();
    expect(screen.getByText('Model Inputs')).toBeInTheDocument();
  });

  it('displays model parameter values', () => {
    render(
      <SegmentationAITab
        config={mockConfig}
        allBands={['B1', 'B2', 'B3', 'B4']}
        updateAIModelConfig={vi.fn()}
        moveBands={vi.fn()}
      />
    );

    // Check that n_estimators value is displayed in the input field
    const nEstimatorsInput = screen.getByTestId('input-n-estimators') as HTMLInputElement;
    expect(nEstimatorsInput.value).toBe('100');
  });

  it('has correct CSS classes', () => {
    const { container } = render(
      <SegmentationAITab
        config={mockConfig}
        allBands={['B1', 'B2', 'B3', 'B4']}
        updateAIModelConfig={vi.fn()}
        moveBands={vi.fn()}
      />
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('iris-tabs-config', 'tabcontent');
  });
});
