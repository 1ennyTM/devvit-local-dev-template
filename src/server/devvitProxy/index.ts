/**
 * Devvit API Barrel Export
 *
 * This module mirrors the @devvit/web/server import pattern for local development.
 * All API proxies switch between official mocks (@devvit/test) in dev and real APIs in production.
 *
 * Usage:
 *   // Local development - use this:
 *   import { reddit, redis, context, scheduler, settings, media, notifications, realtime } from './devvitProxy';
 *
 *   // Production - use the real API:
 *   import { reddit, redis, context, scheduler, settings, media, notifications, realtime } from '@devvit/web/server';
 */

// Core APIs
export { reddit } from './reddit';
export { context } from './context';
export { redis } from './redis';

// Service APIs
export { scheduler } from './scheduler';
export { settings } from './settings';
export { media } from './media';
export { notifications } from './notifications';
export { realtime } from './realtime';
