import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReactViewPort from './ReactViewPort';

const mockView = {
  name: 'test-view',
  type: 'rgb',
  bands: [1, 2, 3],
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
        imageLocation={[0, 0]}
        onImageLocationChange={() => {}}
      />
    );
    expect(container.firstChild).toHaveStyle({ width: '400px', height: '300px' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReactViewPort
        view={mockView}
        index={0}
        width={400}
        height={300}
        showControls={true}
        imageId="test-image"
        imageLocation={[0, 0]}
        onImageLocationChange={() => {}}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveStyle({ width: '400px', height: '300px' });
  });
});