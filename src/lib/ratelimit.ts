import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TODO P8: Rate limiting is experimental and as well as neccessary. Good to take a look.

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

export const conversationsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

export const subscriptionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1m"),
});

export const weatherRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});
