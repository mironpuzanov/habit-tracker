// Re-export shared components
export * from './shared';

// Re-export external (public-facing) components
export * from './external';

// Re-export internal (authenticated app) components
export * from './internal';

// This index file makes it easy to import components by category:
// import { Button } from '@/components/shared';
// import { LandingHero } from '@/components/external';
// import { Dashboard } from '@/components/internal'; 