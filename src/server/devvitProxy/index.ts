/**
 * Devvit API Barrel Export
 *
 * This module mirrors the @devvit/web/server import pattern for local development.
 * All API proxies switch between official mocks (@devvit/test) in dev and real APIs in production.
 *
 */

// Core APIs
export { reddit, initializeReddit } from './reddit';
export { context, initializeContext } from './context';
export { redis } from './redis';

// Service APIs
export { scheduler } from './scheduler';
export { settings } from './settings';
export { media } from './media';
export { notifications } from './notifications';
export { realtime } from './realtime';
