import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// TODO: Rate limiting is neccessary. But I am new to it. Good to take a look and learn more about.
// TODO: Notice. Some limiter is being shared in multiple endpoint. Not bug, but it's better to take a look.

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

export const conversationsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

export const weatherRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

export const subscriptionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1m"),
});

export const checkoutRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1m"),
});
