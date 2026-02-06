import React from 'react';
import { getHeroImage } from '../utils/surfImages';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backgroundImage?: string;
  className?: string;
}

const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  actions,
  backgroundImage = getHeroImage(),
  className = ''
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = !!backgroundImage && !imageFailed;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-accent/10 to-accent/5 ${className}`}>
      <div className="absolute inset-0">
        {showImage && (
          <img
            src={backgroundImage}
            alt="Surf waves"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
      </div>
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-content-primary">{title}</h1>
            {subtitle && (
              <p className="text-sm text-content-secondary mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PageHero };
