import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import SegmentationApp from './segmentation-app';

/**
 * Mock the PreferencesModal component to avoid rendering the full modal in tests.
 * Instead, we render a simple div that we can query and check if it's open or closed.
 */
vi.mock('./components/PreferencesModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="preferences-modal" data-open={isOpen}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('SegmentationApp - URL Parameter Handling', () => {
  let originalLocation: Location;

  /**
   * beforeEach runs before each test in this describe block.
   * We use it to set up a clean test environment:
   * 1. Save the real window.location so we can restore it later
   * 2. Mock window.init_segmentation (legacy function the app expects)
   * 3. Mock window.vars (legacy global variable the app expects)
   */
  beforeEach(() => {
    originalLocation = window.location;
    (window as any).init_segmentation = vi.fn();
    (window as any).vars = {};
  });

  /**
   * afterEach runs after each test in this describe block.
   * We use it to clean up and restore the original state:
   * 1. Restore the real window.location
   * 2. Remove the mocked functions/variables we added
   * This prevents tests from affecting each other.
   */
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    delete (window as any).init_segmentation;
    delete (window as any).vars;
  });

  it('opens preferences modal when openPreferences=true in URL', async () => {
    // Mock window.location to simulate arriving at /segmentation?openPreferences=true
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      search: '?openPreferences=true', // This is what we're testing
      pathname: '/segmentation',
      hostname: 'localhost',
    };

    // Render the component
    const { getByTestId } = render(<SegmentationApp />);

    // Wait for the component to process the URL parameter and open the modal
    await waitFor(() => {
      const modal = getByTestId('preferences-modal');
      expect(modal).toHaveAttribute('data-open', 'true');
    });
  });

  it('does not open preferences modal without URL parameter', async () => {
    // Mock window.location without the openPreferences parameter
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      search: '', // No URL parameters
      pathname: '/segmentation',
      hostname: 'localhost',
    };

    // Render the component
    const { getByTestId } = render(<SegmentationApp />);

    // Verify the modal stays closed
    await waitFor(() => {
      const modal = getByTestId('preferences-modal');
      expect(modal).toHaveAttribute('data-open', 'false');
    });
  });
});
