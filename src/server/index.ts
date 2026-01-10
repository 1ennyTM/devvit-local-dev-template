/**
 * Devvit React Template Server
 *
 * Environment-agnostic Express server with local dev support.
 * Uses proxy pattern for Redis and Reddit API - same code runs locally and in production.
 */

import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, context } from './devvitProxy';
import { IS_DEV } from './devvitProxy/environment';
import { startServer } from './devvitProxy/server';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// =================================
// INTERNAL DEVVIT HOOKS (Production only)
// =================================

if (!IS_DEV) {
  // These routes require Devvit context - only available in production
  void import('./core/post').then(({ createPost }) => {
    router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
      try {
        const post = await createPost();

        res.json({
          status: 'success',
          message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
        });
      } catch (error) {
        console.error(`Error creating post: ${error}`);
        res.status(400).json({
          status: 'error',
          message: 'Failed to create post',
        });
      }
    });

    router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
      try {
        const post = await createPost();

        res.json({
          navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
        });
      } catch (error) {
        console.error(`Error creating post: ${error}`);
        res.status(400).json({
          status: 'error',
          message: 'Failed to create post',
        });
      }
    });
  });
}

// =================================
// CORS FOR LOCAL DEVELOPMENT
// =================================

if (IS_DEV) {
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });
}

// Use router middleware
app.use(router);

// =================================
// START SERVER
// =================================

// Environment determines startup method (local Express vs Devvit wrapper)
startServer(app);
