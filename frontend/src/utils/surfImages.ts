// Curated surf-only image set for consistent, deterministic selection
// All images are high-quality surfing scenes from Unsplash

const SURF_IMAGES = [
  // Beach breaks and lineup shots
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&h=300&fit=crop&crop=center', // Beach lineup
  'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop&crop=center', // Point break waves
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop&crop=center', // Surf lineup at dawn
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&crop=center', // Beach break with surfers

  // Wave action shots
  'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop&crop=center', // Barrel wave
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop&crop=center', // Wave face
  'https://images.unsplash.com/photo-1502681989156-712733622c6b?w=400&h=300&fit=crop&crop=center', // Green wave
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center', // Hollow wave

  // Surf culture and equipment
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center', // Surfboard on beach
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&crop=center', // Surfboard collection
  'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400&h=300&fit=crop&crop=center', // Surfboard waxing
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center', // Wave close-up
];

/**
 * Get a deterministic surf image URL based on an ID or string
 * Uses simple hash function to consistently select from curated image set
 */
export function getSurfImageForId(id: number | string): string {
  const hash = typeof id === 'string'
    ? simpleHash(id)
    : id;

  return SURF_IMAGES[Math.abs(hash) % SURF_IMAGES.length];
}

/**
 * Get a deterministic surf image URL based on spot name
 */
export function getSurfImageForSpot(spotName: string): string {
  return getSurfImageForId(spotName.toLowerCase().trim());
}

/**
 * Get a deterministic surf image URL based on session ID
 */
export function getSurfImageForSession(sessionId: number): string {
  return getSurfImageForId(sessionId);
}

/**
 * Get a hero banner image for the dashboard
 * Returns a high-quality wide surf image
 */
export function getHeroImage(): string {
  return 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=400&fit=crop&crop=center';
}

/**
 * Simple hash function for strings
 * Used to create deterministic but distributed selection from image array
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}