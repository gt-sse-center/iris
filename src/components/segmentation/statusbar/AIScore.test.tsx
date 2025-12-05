import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AIScore from './AIScore';

describe('AIScore', () => {
  it('renders AI score with default value', () => {
    const { container } = render(<AIScore onOpenConfusionMatrix={vi.fn()} />);
    
    const aiScore = container.querySelector('#ai-score');
    expect(aiScore).toBeInTheDocument();
    expect(aiScore?.textContent).toBe('0');
  });

  it('calls onOpenConfusionMatrix when clicked', () => {
    const handleOpenMatrix = vi.fn();
    const { container } = render(<AIScore onOpenConfusionMatrix={handleOpenMatrix} />);
    
    const statusButton = container.querySelector('.statusbutton');
    if (statusButton) {
      fireEvent.click(statusButton);
      expect(handleOpenMatrix).toHaveBeenCalledTimes(1);
    }
  });
});
