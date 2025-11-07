import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BandSelector from './BandSelector';

describe('BandSelector', () => {
  const mockOnSelectionChange = vi.fn();

  it('renders all bands', () => {
    render(
      <BandSelector
        bands={['B1', 'B2', 'B3', 'B4']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText('B3')).toBeInTheDocument();
    expect(screen.getByText('B4')).toBeInTheDocument();
  });

  it('renders as a multi-select', () => {
    const { container } = render(
      <BandSelector
        bands={['B1', 'B2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('multiple');
  });

  it('has correct styling', () => {
    const { container } = render(
      <BandSelector
        bands={['B1']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const select = container.querySelector('select');
    expect(select).toHaveStyle({ width: '125px', height: '200px' });
  });
});
