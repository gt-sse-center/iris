import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AIScore from './AIScore';
import { useSegmentationStore } from '../../../stores/segmentationStore';

// Mock the store
vi.mock('../../../stores/segmentationStore');

describe('AIScore', () => {
  const mockUseSegmentationStore = vi.mocked(useSegmentationStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AI score with default value when no confusion matrix', () => {
    mockUseSegmentationStore.mockReturnValue(null);
    
    const { container } = render(<AIScore onOpenConfusionMatrix={vi.fn()} />);
    
    const aiScore = container.querySelector('#ai-score');
    expect(aiScore).toBeInTheDocument();
    expect(aiScore?.textContent).toBe('0');
  });

  it('renders AI score from confusion matrix when available', () => {
    const mockConfusionMatrix = {
      matrix: [[10, 2], [1, 15]],
      classCount: 2,
      totalSamples: 28,
      accuracyStats: {
        overall: 0.89,
        perClass: [0.83, 0.94],
        worstClass: 0,
        worstAccuracy: 0.83,
        truePositives: { 0: 10, 1: 15 }
      },
      timestamp: new Date(),
      classes: ['Clear', 'Cloud']
    };
    
    mockUseSegmentationStore.mockReturnValue(mockConfusionMatrix);
    
    const { container } = render(<AIScore onOpenConfusionMatrix={vi.fn()} />);
    
    const aiScore = container.querySelector('#ai-score');
    expect(aiScore).toBeInTheDocument();
    expect(aiScore?.textContent).toBe('89'); // Math.round(0.89 * 100)
  });

  it('calls onOpenConfusionMatrix when clicked', () => {
    mockUseSegmentationStore.mockReturnValue(null);
    const handleOpenMatrix = vi.fn();
    
    const { container } = render(<AIScore onOpenConfusionMatrix={handleOpenMatrix} />);
    
    const statusButton = container.querySelector('.statusbutton');
    if (statusButton) {
      fireEvent.click(statusButton);
      expect(handleOpenMatrix).toHaveBeenCalledTimes(1);
    }
  });
});
