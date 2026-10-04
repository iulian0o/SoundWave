import client from "./redis.js";

export const checkShareLimit = async (userId, limit = 10, windowSec = 60) => {
  if (!client.isReady) {
    return { allowed: true };
  }

    try {
      const key = `retlimit:share:${userId}`;
      const [count, ttl] = await client.multi().incr(key).ttl(key).exec();
      
      if (count === 1 || ttl < 0) {
        await client.expire(key, windowSec);
      }

      if (count > limit) {
        return { allowed: false, retryAfter: ttl > 0 ? ttl : windowSec }
      }

      return { allowed: true }
      
    } catch (error) {
      console.error('Rate limit error: ', error);
      return { allowed: true };
    }
}

export const isDuplicateShare = async (senderId, receiverId, songId, ttlSec = 10) => {
  if (!client.isReady) {
    return false;
  }

  try {
    const key = `dedup:share:${senderId}:${receiverId}:${songId}`;
    const result = await client.set(key, '1', { NX: true, EX: ttlSec });

    return result === null;
  } catch (error) {
    console.error("Dedup error: ", error);
    return false;
  }
}