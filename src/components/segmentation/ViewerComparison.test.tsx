import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ViewerComparison from './ViewerComparison';

// Mock the stores
const mockUseViewManagerStore = vi.fn();
vi.mock('../../stores/viewManagerStore', () => ({
  useViewManagerStore: () => mockUseViewManagerStore(),
}));

// Mock ReactViewManager component
vi.mock('./ReactViewManager', () => ({
  default: () => <div data-testid="react-view-manager">React ViewManager</div>,
}));

// Mock ErrorBoundary component
vi.mock('./ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock legacy functions that might be called
beforeEach(() => {
  // Mock window.vars and legacy functions
  (window as any).vars = {
    config: { views: {} },
  };
});

describe('ViewerComparison', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mock return value
    mockUseViewManagerStore.mockReturnValue({
      isInitialized: false,
      initializeFromLegacy: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders initialization message when not initialized', async () => {
    await act(async () => {
      render(<ViewerComparison />);
    });
    expect(screen.getByText('Initializing React ViewManager...')).toBeInTheDocument();
  });

  it('renders React ViewManager when initialized', async () => {
    // Mock initialized state
    mockUseViewManagerStore.mockReturnValue({
      isInitialized: true,
      initializeFromLegacy: vi.fn().mockResolvedValue(undefined),
    });

    await act(async () => {
      render(<ViewerComparison />);
    });
    
    expect(screen.getByTestId('react-view-manager')).toBeInTheDocument();
    expect(screen.getByText('React ViewManager')).toBeInTheDocument();
  });

  it('has proper container styling', async () => {
    await act(async () => {
      render(<ViewerComparison />);
    });
    
    const container = screen.getByText('Initializing React ViewManager...').parentElement;
    expect(container).toHaveStyle({
      width: '100%',
      height: '800px',
    });
  });
});