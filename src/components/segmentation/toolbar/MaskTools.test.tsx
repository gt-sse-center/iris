import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MaskTools from './MaskTools';

describe('MaskTools', () => {
  it('renders mask tool buttons', () => {
    const { container } = render(<MaskTools />);
    
    expect(container.querySelector('#tb_toggle_mask')).toBeInTheDocument();
    expect(container.querySelector('#tb_mask_final')).toBeInTheDocument();
    expect(container.querySelector('#tb_mask_user')).toBeInTheDocument();
    expect(container.querySelector('#tb_mask_errors')).toBeInTheDocument();
  });
});
