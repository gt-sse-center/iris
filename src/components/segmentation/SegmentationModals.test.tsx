import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SegmentationModals from './SegmentationModals';

describe('SegmentationModals', () => {
  const mockProps = {
    isPreferencesOpen: false,
    onClosePreferences: vi.fn(),
    isProfileOpen: false,
    onCloseProfile: vi.fn(),
    profileUserId: 'current',
    isLoginOpen: false,
    loginMode: 'login' as const,
    isHelpOpen: false,
    onCloseHelp: vi.fn(),
    isResetMaskOpen: false,
    onCloseResetMask: vi.fn(),
    onConfirmResetMask: vi.fn(),
    isClassSelectionOpen: false,
    onCloseClassSelection: vi.fn(),
    isImageInfoOpen: false,
    onCloseImageInfo: vi.fn(),
    isConfusionMatrixOpen: false,
    onCloseConfusionMatrix: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<SegmentationModals {...mockProps} />);
    expect(document.body).toBeInTheDocument();
  });

  it('shows preferences modal when open', () => {
    render(<SegmentationModals {...mockProps} isPreferencesOpen={true} />);
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('shows help modal when open', () => {
    render(<SegmentationModals {...mockProps} isHelpOpen={true} />);
    expect(screen.getByText('Help')).toBeInTheDocument();
  });
});
