import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SurfForecastWidget } from './SurfForecastWidget';

describe('SurfForecastWidget', () => {
  it('opens and closes modal, locking body scroll', async () => {
    const user = userEvent.setup();
    render(<SurfForecastWidget spotName="Pipeline" />);

    const button = screen.getByRole('button', { name: /forecast/i });
    expect(button).toBeInTheDocument();

    await user.click(button);

    const iframe = screen.getByTitle('Surf forecast for Pipeline') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('Pipeline/forecasts/widget/m');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTitle('Surf forecast for Pipeline')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('renders nothing when no spot name is provided', () => {
    const { container } = render(<SurfForecastWidget />);
    expect(container).toBeEmptyDOMElement();
  });
});
