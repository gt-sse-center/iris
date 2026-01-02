import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReactViewPort from './ReactViewPort';

const mockView = {
  name: 'test-view',
  type: 'image' as const,
  description: 'Test view for unit testing',
};

describe('ReactViewPort', () => {
  it('renders with basic props', () => {
    const { container } = render(
      <ReactViewPort
        view={mockView}
        index={0}
        width={400}
        height={300}
        showControls={true}
        imageId="test-image"
        onImageLocationChange={() => {}}
      />
    );
    expect(container.firstChild).toHaveStyle({ width: '400px', height: '300px' });
  });

  it('renders with controls hidden', () => {
    const { container } = render(
      <ReactViewPort
        view={mockView}
        index={0}
        width={400}
        height={300}
        showControls={false}
        imageId="test-image"
        onImageLocationChange={() => {}}
      />
    );
    expect(container.firstChild).toHaveStyle({ width: '400px', height: '300px' });
  });
});