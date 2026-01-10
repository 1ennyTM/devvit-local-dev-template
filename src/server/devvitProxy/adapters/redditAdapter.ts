/**
 * Reddit API Adapter for Official Devvit Mocks
 *
 * Wraps the official RedditPluginMock from @devvit/reddit/test to provide
 * a high-level interface matching @devvit/web/server reddit API.
 */

import type { RedditPluginMock } from '@devvit/reddit/test';
import { getDevContext } from '../devvitMocks';

export interface RedditUser {
    id: string;
    username: string;
    createdAt?: Date | undefined;
    linkKarma?: number | undefined;
    commentKarma?: number | undefined;
}

export interface RedditSubreddit {
    id: string;
    name: string;
    title?: string | undefined;
    description?: string | undefined;
    subscribersCount?: number | undefined;
    createdAt?: Date | undefined;
}

export interface RedditPost {
    id: string;
    title: string;
    authorName?: string | undefined;
    subredditName?: string | undefined;
    body?: string | undefined;
    url?: string | undefined;
    createdAt?: Date | undefined;
    score?: number | undefined;
}

export interface RedditComment {
    id: string;
    body: string;
    authorName?: string | undefined;
    postId?: string | undefined;
    createdAt?: Date | undefined;
    score?: number | undefined;
}

export function createRedditAdapter(redditMock: RedditPluginMock) {
    const devContext = getDevContext();

    return {
        async getCurrentUsername(): Promise<string | null> {
            try {
                const result = await redditMock.users.plugin.UserAbout({
                    username: devContext.username,
                });
                return result.data?.name ?? devContext.username;
            } catch {
                return devContext.username;
            }
        },

        async getCurrentUser(): Promise<RedditUser | null> {
            try {
                const result = await redditMock.users.plugin.UserAbout({
                    username: devContext.username,
                });
                if (result.data) {
                    return {
                        id: result.data.id ?? devContext.userId,
                        username: result.data.name ?? devContext.username,
                        createdAt: result.data.createdUtc ? new Date(result.data.createdUtc * 1000) : undefined,
                        linkKarma: result.data.linkKarma,
                        commentKarma: result.data.commentKarma,
                    };
                }
            } catch {
                // Fall back to dev config
            }

            return {
                id: devContext.userId,
                username: devContext.username,
            };
        },

        async getCurrentSubreddit(): Promise<RedditSubreddit | null> {
            try {
                const result = await redditMock.subreddits.plugin.SubredditAbout({
                    subreddit: devContext.subredditName,
                });
                if (result.data) {
                    return {
                        id: result.data.name ? `t5_${result.data.name}` : devContext.subredditId,
                        name: result.data.displayName ?? devContext.subredditName,
                        title: result.data.title,
                        description: result.data.publicDescription,
                        subscribersCount: result.data.subscribers,
                        createdAt: result.data.createdUtc ? new Date(result.data.createdUtc * 1000) : undefined,
                    };
                }
            } catch {
                // Fall back to dev config
            }

            return {
                id: devContext.subredditId,
                name: devContext.subredditName,
            };
        },

        async getUserByUsername(username: string): Promise<RedditUser | null> {
            try {
                const result = await redditMock.users.plugin.UserAbout({ username });
                if (result.data) {
                    return {
                        id: result.data.id ?? `t2_${username}`,
                        username: result.data.name ?? username,
                        createdAt: result.data.createdUtc ? new Date(result.data.createdUtc * 1000) : undefined,
                        linkKarma: result.data.linkKarma,
                        commentKarma: result.data.commentKarma,
                    };
                }
            } catch {
                // User not found
            }
            return null;
        },

        async getUserById(userId: string): Promise<RedditUser | null> {
            try {
                const result = await redditMock.users.plugin.UserDataByAccountIds({
                    ids: userId,
                } as any);
                const userData = (result as any).users?.[userId] ?? (result as any)[userId];
                if (userData) {
                    return {
                        id: userId,
                        username: userData.name ?? userData.username ?? 'unknown',
                        createdAt: userData.createdUtc ? new Date(userData.createdUtc * 1000) : undefined,
                        linkKarma: userData.linkKarma,
                        commentKarma: userData.commentKarma,
                    };
                }
            } catch {
                // User not found
            }
            return null;
        },

        async getPostById(postId: string): Promise<RedditPost | null> {
            try {
                const result = await redditMock.linksAndComments.plugin.Info({
                    thingIds: [postId],
                    subreddits: [],
                } as any);
                const children = (result as any).data?.children ?? (result as any).children ?? [];
                const postData = children.find((c: any) => c.data?.id === postId || c.data?.name === postId);
                if (postData?.data) {
                    const data = postData.data;
                    return {
                        id: data.name ?? postId,
                        title: data.title ?? '',
                        authorName: data.author,
                        subredditName: data.subreddit,
                        body: data.selftext,
                        url: data.url,
                        createdAt: data.createdUtc ? new Date(data.createdUtc * 1000) : undefined,
                        score: data.score,
                    };
                }
            } catch {
                // Post not found
            }
            return null;
        },

        async getCommentById(commentId: string): Promise<RedditComment | null> {
            try {
                const result = await redditMock.linksAndComments.plugin.Info({
                    thingIds: [commentId],
                    subreddits: [],
                } as any);
                const children = (result as any).data?.children ?? (result as any).children ?? [];
                const commentData = children.find((c: any) => c.data?.id === commentId || c.data?.name === commentId);
                if (commentData?.data) {
                    const data = commentData.data;
                    return {
                        id: data.name ?? commentId,
                        body: data.body ?? '',
                        authorName: data.author,
                        postId: data.linkId,
                        createdAt: data.createdUtc ? new Date(data.createdUtc * 1000) : undefined,
                        score: data.score,
                    };
                }
            } catch {
                // Comment not found
            }
            return null;
        },

        async submitCustomPost(options: {
            entry?: string;
            subredditName?: string;
            title: string;
            postData?: Record<string, unknown>;
        }): Promise<{ id: string; url: string }> {
            const subredditName = options.subredditName ?? devContext.subredditName;

            try {
                const result = await redditMock.linksAndComments.plugin.SubmitCustomPost({
                    sr: subredditName,
                    title: options.title,
                    kind: 'custom',
                } as any);
                const postId = (result as any).json?.data?.id ?? (result as any).id ?? devContext.postId;
                return {
                    id: postId,
                    url: `https://reddit.com/r/${subredditName}/comments/${postId}`,
                };
            } catch {
                return {
                    id: devContext.postId,
                    url: `https://reddit.com/r/${subredditName}/comments/${devContext.postId}`,
                };
            }
        },

        async submitComment(options: { id: string; text: string }): Promise<{ id: string }> {
            try {
                const result = await redditMock.linksAndComments.plugin.Comment({
                    thingId: options.id,
                    text: options.text,
                } as any);
                const commentId = (result as any).json?.data?.things?.[0]?.data?.id ?? 't1_devcomment123';
                return { id: commentId };
            } catch {
                return { id: 't1_devcomment123' };
            }
        },

        async delete(thingId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Del({ id: thingId });
        },

        /**
         * @param direction - 1 for upvote, -1 for downvote, 0 to remove vote
         */
        async vote(thingId: string, direction: 1 | -1 | 0): Promise<void> {
            await redditMock.linksAndComments.plugin.Vote({
                id: thingId,
                dir: direction,
            } as any);
        },

        async save(thingId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Save({ id: thingId } as any);
        },

        async unsave(thingId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Unsave({ id: thingId });
        },

        async hide(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Hide({ id: postId });
        },

        async unhide(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Unhide({ id: postId });
        },

        async lock(thingId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Lock({ id: thingId });
        },

        async unlock(thingId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Unlock({ id: thingId });
        },

        async markNSFW(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.MarkNSFW({ id: postId });
        },

        async unmarkNSFW(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.UnmarkNSFW({ id: postId });
        },

        async spoiler(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Spoiler({ id: postId });
        },

        async unspoiler(postId: string): Promise<void> {
            await redditMock.linksAndComments.plugin.Unspoiler({ id: postId });
        },

        async editCustomPost(options: {
            postId: string;
            data: Record<string, unknown>;
        }): Promise<void> {
            await redditMock.linksAndComments.plugin.EditCustomPost({
                thingId: options.postId,
                ...options.data,
            } as any);
        },

        async editUserText(options: {
            thingId: string;
            text: string;
        }): Promise<void> {
            await redditMock.linksAndComments.plugin.EditUserText({
                thingId: options.thingId,
                text: options.text,
            } as any);
        },

        async report(options: {
            thingId: string;
            reason: string;
        }): Promise<void> {
            await redditMock.linksAndComments.plugin.Report({
                thingId: options.thingId,
                reason: options.reason,
            } as any);
        },
    };
}

export function createContextAdapter() {
    const devContext = getDevContext();

    return {
        get postId() {
            return devContext.postId;
        },
        get subredditName() {
            return devContext.subredditName;
        },
        get subredditId() {
            return devContext.subredditId;
        },
        get userId() {
            return devContext.userId;
        },
    };
}

export type RedditAdapter = ReturnType<typeof createRedditAdapter>;
export type ContextAdapter = ReturnType<typeof createContextAdapter>;
