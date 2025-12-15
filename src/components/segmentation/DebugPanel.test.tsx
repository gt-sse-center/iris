import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import DebugPanel from './DebugPanel';

// Mock the store
const mockStore = {
  currentGroup: 0,
  views: [],
  getCurrentViews: () => [],
};

vi.mock('../../stores/viewManagerStore', () => ({
  useViewManagerStore: () => mockStore,
}));

describe('DebugPanel', () => {
  beforeEach(() => {
    // Mock window.vars
    (window as any).vars = {
      config: { views: {} },
      image_shape: [100, 100],
    };
  });

  it('renders debug panel title', () => {
    render(<DebugPanel />);
    expect(screen.getByText('🐛 Debug')).toBeInTheDocument();
  });

  it('shows debug button', () => {
    render(<DebugPanel />);
    expect(screen.getByText('🐛 Debug')).toBeInTheDocument();
  });
});