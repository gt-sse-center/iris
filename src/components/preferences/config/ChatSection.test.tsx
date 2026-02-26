import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import ChatSection from './ChatSection';

describe('ChatSection', () => {
  it('loads and displays config from backend', () => {
    const ref = createRef<any>();
    render(<ChatSection ref={ref} />);
    
    act(() => {
      ref.current?.setData({
        enabled: true,
        github_repo: 'test-org/test-repo',
        utterances_theme: 'github-dark'
      });
    });
    
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByPlaceholderText('owner/repository')).toHaveValue('test-org/test-repo');
    expect(screen.getByRole('combobox')).toHaveValue('github-dark');
  });

  it('disables fields when chat is disabled', () => {
    const ref = createRef<any>();
    render(<ChatSection ref={ref} />);
    
    act(() => {
      ref.current?.setData({
        enabled: true,
        github_repo: 'test/repo',
        utterances_theme: 'github-light'
      });
    });
    
    const checkbox = screen.getByRole('checkbox');
    act(() => {
      fireEvent.click(checkbox);
    });
    
    expect(screen.getByPlaceholderText('owner/repository')).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows validation error when enabled but repo empty', () => {
    const ref = createRef<any>();
    render(<ChatSection ref={ref} />);
    
    act(() => {
      ref.current?.setData({
        enabled: true,
        github_repo: '',
        utterances_theme: 'github-light'
      });
    });
    
    expect(screen.getByText(/GitHub repository is required when chat is enabled/i)).toBeInTheDocument();
  });
});
