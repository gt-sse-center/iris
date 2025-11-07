import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ViewsTab from './ViewsTab';

describe('ViewsTab', () => {
  it('renders the placeholder message', () => {
    render(<ViewsTab />);
    expect(screen.getByText('Not yet implemented.')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const { container } = render(<ViewsTab />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('iris-tabs-config', 'tabcontent');
  });

  it('is visible by default', () => {
    const { container } = render(<ViewsTab />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveStyle({ display: 'block' });
  });
});
