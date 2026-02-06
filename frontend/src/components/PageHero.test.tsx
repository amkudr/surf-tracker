import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PageHero } from './PageHero';

vi.mock('../utils/surfImages', () => ({
  getHeroImage: vi.fn(() => 'https://example.com/hero.jpg'),
}));

describe('PageHero', () => {
  it('renders title, subtitle and actions with default hero image', () => {
    render(
      <PageHero
        title="Surf Dashboard"
        subtitle="Recent sessions overview"
        actions={<button>Do it</button>}
      />
    );

    expect(screen.getByText('Surf Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Recent sessions overview')).toBeInTheDocument();
    expect(screen.getByText('Do it')).toBeInTheDocument();

    const image = screen.getByAltText('Surf waves') as HTMLImageElement;
    expect(image.src).toContain('https://example.com/hero.jpg');
  });

  it('uses provided background image when supplied', () => {
    render(
      <PageHero
        title="Custom Hero"
        backgroundImage="https://example.com/custom.jpg"
      />
    );

    const image = screen.getByAltText('Surf waves') as HTMLImageElement;
    expect(image.src).toContain('custom.jpg');
  });
});
