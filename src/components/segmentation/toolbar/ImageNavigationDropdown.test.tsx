/**
 * Tests for ImageNavigationDropdown component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ImageNavigationDropdown } from './ImageNavigationDropdown';

// Mock fetch
global.fetch = vi.fn();

describe('ImageNavigationDropdown', () => {
  const mockImages = [
    {
      image_id: 'image_001',
      has_user_annotation: true,
      has_any_annotation: true,
      annotation_count: 1
    },
    {
      image_id: 'image_002',
      has_user_annotation: false,
      has_any_annotation: true,
      annotation_count: 2
    },
    {
      image_id: 'image_003',
      has_user_annotation: false,
      has_any_annotation: false,
      annotation_count: 0
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ images: mockImages, current_image_id: 'image_001' })
    });
  });

  it('should render current image name', () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText('image_001')).toBeInTheDocument();
  });

  it('should fetch images on mount', async () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/segmentation/api/images/list')
      );
    });
  });

  it('should open dropdown when button is clicked', async () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    const dropdown = screen.getByText('image_001').closest('div');
    fireEvent.click(dropdown!);

    await waitFor(() => {
      expect(screen.getByText('Image')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should display all images in dropdown', async () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    const dropdown = screen.getByText('image_001').closest('div');
    fireEvent.click(dropdown!);

    await waitFor(() => {
      expect(screen.getAllByText('image_001').length).toBeGreaterThan(0);
      expect(screen.getByText('image_002')).toBeInTheDocument();
      expect(screen.getByText('image_003')).toBeInTheDocument();
    });
  });

  it('should call onNavigate when image is selected', async () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    const dropdown = screen.getByText('image_001').closest('div');
    fireEvent.click(dropdown!);

    await waitFor(() => {
      const image002 = screen.getAllByText('image_002')[0];
      fireEvent.click(image002.closest('.image-dropdown-item')!);
    });

    expect(onNavigate).toHaveBeenCalledWith('image_002');
  });

  it('should close dropdown after selecting image', async () => {
    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    const dropdown = screen.getByText('image_001').closest('div');
    fireEvent.click(dropdown!);

    await waitFor(() => {
      const image002 = screen.getAllByText('image_002')[0];
      fireEvent.click(image002.closest('.image-dropdown-item')!);
    });

    // Dropdown should be closed (header not visible)
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });

  it('should show loading state while fetching', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    const dropdown = screen.getByText('image_001').closest('div');
    fireEvent.click(dropdown!);

    expect(screen.getByText('Loading images...')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const onNavigate = vi.fn();
    render(
      <ImageNavigationDropdown
        currentImageId="image_001"
        onNavigate={onNavigate}
      />
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error fetching images:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });
});
