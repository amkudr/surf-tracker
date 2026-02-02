import { ReactNode } from 'react';

interface MapProviderProps {
  children: ReactNode;
}

/**
 * Leaflet doesn't require a top-level provider with an API key like Google Maps.
 * We keep this component as a wrapper if we need to add global map configurations later.
 */
export const MapProvider = ({ children }: MapProviderProps) => {
  return (
    <>
      {children}
    </>
  );
};
