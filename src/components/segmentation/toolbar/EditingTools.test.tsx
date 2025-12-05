import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import EditingTools from './EditingTools';

describe('EditingTools', () => {
  it('renders undo and redo buttons', () => {
    const { container } = render(<EditingTools />);
    
    const undoButton = container.querySelector('#tb_undo');
    const redoButton = container.querySelector('#tb_redo');
    
    expect(undoButton).toBeInTheDocument();
    expect(redoButton).toBeInTheDocument();
  });
});
