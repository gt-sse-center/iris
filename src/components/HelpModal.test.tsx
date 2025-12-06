import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpModal from './HelpModal';

describe('HelpModal', () => {
  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={false} onClose={onClose} />);
    
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    expect(screen.getByTestId('help-modal')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('displays all tabs', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    expect(screen.getByTestId('tab-welcome')).toBeInTheDocument();
    expect(screen.getByTestId('tab-faqs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-hotkeys')).toBeInTheDocument();
    expect(screen.getByTestId('tab-about')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    // Welcome tab is active by default
    expect(screen.getByTestId('tab-welcome')).toHaveClass('checked');
    
    // Click FAQs tab
    fireEvent.click(screen.getByTestId('tab-faqs'));
    expect(screen.getByTestId('tab-faqs')).toHaveClass('checked');
    expect(screen.getByTestId('tab-welcome')).not.toHaveClass('checked');
    
    // Click Hotkeys tab
    fireEvent.click(screen.getByTestId('tab-hotkeys'));
    expect(screen.getByTestId('tab-hotkeys')).toHaveClass('checked');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByTestId('close-help-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays hotkeys table in hotkeys tab', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByTestId('tab-hotkeys'));
    
    // Check for some hotkeys
    expect(screen.getByText('Select class')).toBeInTheDocument();
    expect(screen.getByText('Train AI assistant')).toBeInTheDocument();
    expect(screen.getByText('Save mask')).toBeInTheDocument();
  });

  it('displays about information in about tab', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByTestId('tab-about'));
    
    expect(screen.getByText(/John Mrziglod/)).toBeInTheDocument();
    expect(screen.getByText(/Alistair Francis/)).toBeInTheDocument();
  });

  it('toggles accordion sections in FAQs tab', () => {
    const onClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByTestId('tab-faqs'));
    
    const accordion = screen.getByText("I'm painting pixels, but nothing's happening!");
    
    // Initially not checked
    expect(accordion).not.toHaveClass('checked');
    
    // Click to open
    fireEvent.click(accordion);
    expect(accordion).toHaveClass('checked');
    
    // Click to close
    fireEvent.click(accordion);
    expect(accordion).not.toHaveClass('checked');
  });
});
