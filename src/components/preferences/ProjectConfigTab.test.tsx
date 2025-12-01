import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProjectConfigTab from './ProjectConfigTab';
import * as configService from '../../services/config';

// Mock the config service
vi.mock('../../services/config', () => ({
  getProjectConfig: vi.fn(),
  updateProjectConfig: vi.fn(),
  validateProjectConfig: vi.fn(),
}));

describe('ProjectConfigTab', () => {
  const mockConfig: configService.ProjectConfig = {
    name: 'test-project',
    host: '127.0.0.1',
    port: 5000,
    images: {
      path: 'images/{id}.tif',
      shape: [512, 512] as [number, number],
      thumbnails: false,
      metadata: false,
    },
    classes: [
      {
        name: 'Cloud',
        colour: [255, 255, 0, 70] as [number, number, number, number],
        description: 'Cloud pixels',
      },
    ],
    views: {
      RGB: {
        type: 'image' as const,
        data: ['$B4', '$B3', '$B2'],
      },
    },
    view_groups: {
      default: ['RGB'],
    },
    segmentation: {
      path: 'masks/{id}.png',
      ai_model: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('displays loading message initially', () => {
      vi.mocked(configService.getProjectConfig).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ProjectConfigTab />);
      
      expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
    });

    it('hides loading message after config loads', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration loading', () => {
    it('calls getProjectConfig on mount', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(configService.getProjectConfig).toHaveBeenCalledTimes(1);
      });
    });

    it('populates sections with loaded data', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-project')).toBeInTheDocument();
      });
    });

    it('displays success message after loading', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText(/Configuration loaded successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('displays error message when loading fails', async () => {
      vi.mocked(configService.getProjectConfig).mockRejectedValue(
        new Error('Failed to load config')
      );
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load config/)).toBeInTheDocument();
      });
    });

    it('displays error message when save fails', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configService.updateProjectConfig).mockRejectedValue(
        new Error('Failed to save')
      );
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to save/)).toBeInTheDocument();
      });
    });

    it('displays validation errors', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: false,
        errors: ['Invalid shape', 'Missing required field'],
        warnings: [],
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid shape/)).toBeInTheDocument();
        expect(screen.getByText(/Missing required field/)).toBeInTheDocument();
      });
    });
  });

  describe('Save functionality', () => {
    it('collects data from all sections', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configService.updateProjectConfig).mockResolvedValue({
        message: 'Success',
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(configService.validateProjectConfig).toHaveBeenCalled();
        expect(configService.updateProjectConfig).toHaveBeenCalled();
      });
    });

    it('validates before saving', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configService.updateProjectConfig).mockResolvedValue({
        message: 'Success',
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(configService.validateProjectConfig).toHaveBeenCalled();
        expect(configService.updateProjectConfig).toHaveBeenCalled();
      });
    });

    it('does not save if validation fails', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: false,
        errors: ['Invalid config'],
        warnings: [],
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(configService.validateProjectConfig).toHaveBeenCalled();
      });
      
      expect(configService.updateProjectConfig).not.toHaveBeenCalled();
    });

    it('displays success message after save', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configService.updateProjectConfig).mockResolvedValue({
        message: 'Configuration saved successfully',
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        expect(screen.getByText(/Configuration saved successfully/)).toBeInTheDocument();
      });
    });

    it('saves successfully even with validation warnings', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: ['Consider adding more classes'],
      });
      vi.mocked(configService.updateProjectConfig).mockResolvedValue({
        message: 'Success',
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      // Should still save successfully even with warnings
      await waitFor(() => {
        expect(configService.updateProjectConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Section rendering', () => {
    it('renders all section components', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      const { container } = render(<ProjectConfigTab />);
      
      await waitFor(() => {
        // Check that sections are rendered by looking for accordion elements
        const accordions = container.querySelectorAll('.accordion');
        expect(accordions.length).toBeGreaterThan(0);
        
        // Check for the save button
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
    });
  });

  describe('Ref communication', () => {
    it('calls getData on all section refs when saving', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configService.updateProjectConfig).mockResolvedValue({
        message: 'Success',
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        const callArg = vi.mocked(configService.updateProjectConfig).mock.calls[0][0];
        expect(callArg).toHaveProperty('name');
        expect(callArg).toHaveProperty('images');
        expect(callArg).toHaveProperty('classes');
        expect(callArg).toHaveProperty('views');
        expect(callArg).toHaveProperty('view_groups');
      });
    });

    it('calls setData on all section refs after loading', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        // Check that data was populated in sections
        expect(screen.getByDisplayValue('test-project')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cloud')).toBeInTheDocument();
      });
    });
  });

  describe('Button states', () => {
    it('shows loading state and hides save button while loading', () => {
      vi.mocked(configService.getProjectConfig).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ProjectConfigTab />);
      
      // Should show loading message
      expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
      
      // Save button should not be visible during loading
      expect(screen.queryByText('Save Complete Configuration')).not.toBeInTheDocument();
    });

    it('enables save button after loading', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Complete Configuration');
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('disables save button while saving', async () => {
      vi.mocked(configService.getProjectConfig).mockResolvedValue({
        config: mockConfig,
        config_file: '/path/to/config.json',
      });
      vi.mocked(configService.validateProjectConfig).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ProjectConfigTab />);
      
      await waitFor(() => {
        expect(screen.getByText('Save Complete Configuration')).not.toBeDisabled();
      });
      
      fireEvent.click(screen.getByText('Save Complete Configuration'));
      
      await waitFor(() => {
        const saveButton = screen.getByText('Saving...');
        expect(saveButton).toBeDisabled();
      });
    });
  });
});
