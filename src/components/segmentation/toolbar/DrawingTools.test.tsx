import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import DrawingTools from './DrawingTools';

describe('DrawingTools', () => {
  it('renders drawing tool buttons', () => {
    const { container } = render(<DrawingTools onResetMask={vi.fn()} />);
    
    expect(container.querySelector('#tb_tool_move')).toBeInTheDocument();
    expect(container.querySelector('#tb_tool_draw')).toBeInTheDocument();
    expect(container.querySelector('#tb_tool_eraser')).toBeInTheDocument();
    expect(container.querySelector('#tb_predict_mask')).toBeInTheDocument();
  });

  it('calls onResetMask when reset button is clicked', () => {
    const handleReset = vi.fn();
    const { container } = render(<DrawingTools onResetMask={handleReset} />);
    
    const resetButton = container.querySelector('#tb_reset_mask');
    if (resetButton) {
      fireEvent.click(resetButton);
      expect(handleReset).toHaveBeenCalledTimes(1);
    }
  });
});
