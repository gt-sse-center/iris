import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import FilterTools from './FilterTools';

describe('FilterTools', () => {
  it('renders filter tool buttons', () => {
    const { container } = render(<FilterTools />);
    
    expect(container.querySelector('#tb_brightness_up')).toBeInTheDocument();
    expect(container.querySelector('#tb_brightness_down')).toBeInTheDocument();
    expect(container.querySelector('#tb_saturation_up')).toBeInTheDocument();
    expect(container.querySelector('#tb_saturation_down')).toBeInTheDocument();
    expect(container.querySelector('#tb_toggle_contrast')).toBeInTheDocument();
    expect(container.querySelector('#tb_toggle_invert')).toBeInTheDocument();
    expect(container.querySelector('#tb_reset_filters')).toBeInTheDocument();
  });
});
