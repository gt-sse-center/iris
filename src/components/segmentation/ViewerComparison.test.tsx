import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ViewerComparison from './ViewerComparison';

// Mock the store
vi.mock('../../stores/viewManagerStore', () => ({
  initializeViewManagerFromLegacy: vi.fn(),
  useViewManagerStore: () => ({
    currentGroup: 0,
    views: [],
    getCurrentViews: () => [],
    updateViewDimensions: vi.fn(),
    setImageLocation: vi.fn(),
    viewWidth: 800,
    viewHeight: 600,
    showControls: true,
    imageId: 'test-image',
    imageLocation: [0, 0] as [number, number],
  }),
}));

// Mock legacy functions that might be called
beforeEach(() => {
  // Mock window.vars and legacy functions
  (window as any).vars = {
    debug_mode: true,
    config: { views: {} },
    vm: { updateViewDimensions: vi.fn() },
  };
  (window as any).init_views = vi.fn();
  (window as any).updateViewDimensions = vi.fn();
});

describe('ViewerComparison', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('renders debug mode notice', async () => {
    await act(async () => {
      render(<ViewerComparison />);
    });
    expect(screen.getByText(/Debug Mode: Comparing Legacy vs React ViewManagers/)).toBeInTheDocument();
  });

  it('shows legacy and react viewer sections', async () => {
    await act(async () => {
      render(<ViewerComparison />);
    });
    expect(screen.getByText('🔧 Legacy ViewManager (JavaScript)')).toBeInTheDocument();
    expect(screen.getByText('⚛️ React ViewManager (New)')).toBeInTheDocument();
  });

  it('toggles legacy viewer visibility', async () => {
    await act(async () => {
      render(<ViewerComparison />);
    });
    const hideButton = screen.getAllByText('Hide')[0];
    await act(async () => {
      fireEvent.click(hideButton);
    });
    expect(screen.getAllByText('Show')[0]).toBeInTheDocument();
  });
});