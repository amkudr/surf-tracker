import { useState, useEffect } from 'react';
import { Waves, X } from 'lucide-react';
import { Button } from './ui/Button';

interface SurfForecastWidgetProps {
  spotName?: string;
  className?: string;
  buttonLabel?: string;
  buttonClassName?: string;
}

export const SurfForecastWidget = ({ 
  spotName, 
  className = '', 
  buttonLabel = 'Forecast',
  buttonClassName = '',
}: SurfForecastWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!spotName) {
    return null;
  }

  return (
    <div className={`surf-forecast-widget ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        title="Show Forecast Pop-up"
      >
        <Waves className="h-3 w-3 mr-1 text-accent" />
        <span>{buttonLabel}</span>
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Waves className="h-5 w-5 text-accent" />
                <h3 className="text-xl font-semibold text-content-primary">
                  {spotName.replace(/-/g, ' ')} Forecast
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-content-tertiary/10 text-content-secondary hover:text-content-primary transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Body - Iframe */}
            <div className="flex-1 overflow-auto bg-background p-2 sm:p-4">
              <div className="relative w-full" style={{ minHeight: '410px' }}>
                <iframe
                  className="w-full"
                  allowTransparency={true}
                  src={`//www.surf-forecast.com/breaks/${spotName}/forecasts/widget/m`}
                  scrolling="no"
                  frameBorder="0"
                  marginWidth={0}
                  marginHeight={0}
                  style={{ width: '100%', height: '410px' }}
                  title={`Surf forecast for ${spotName}`}
                />
              </div>
            </div>
            
            {/* Modal Footer - Simple link */}
            <div className="px-6 py-3 border-t border-border bg-content-tertiary/5 text-right">
              <a 
                href={`https://www.surf-forecast.com/breaks/${spotName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline inline-flex items-center"
              >
                View full forecast on Surf-Forecast.com
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
