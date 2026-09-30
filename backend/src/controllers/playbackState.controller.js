import client from '../lib/redis.js';
import { Song } from "../models/song.model.js";

const MAX_QUEUE = 50
const OBJECT_ID = /^[0-9a-f]{24}$/i;

export const getPlaybackState = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const state = await client.hGetAll(`playback:${userId}`);

    if (!state.songId) return res.status(200).json(null);

    const song = await Song.findById(state.songId);

    let queue = [];
    if (state.queue) {
      try {
        const ids = JSON.parse(state.queue);
        const songs = await Song.find({ _id: { $in: ids } });
        const byId = new Map(songs.map((s) => [String(s._id), s]));
        queue = ids.map((id) => byId.get(id)).filter(Boolean);
      } catch {
        queue = [];
      }
    }

    res.status(200).json({
      song,
      position: Number(state.position),
      volume: state.volume !== undefined ? Number(state.volume) : undefined,
      queue,
    });
  } catch (error) {
    next(error);
  }
};
export const savePlaybackState = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const { songId, position, volume } = req.body; 

    if (!songId || typeof position !== "number") {
      return res.status(400).json({ message: "songId and position are required" });
    }

    if (volume !== undefined && (typeof volume !== "number" || volume < 0 || volume > 100)) {
      return res.status(400).json({ message: "volume must be a number between 0 and 100" });
    }

    const fields = { songId, position: String(position), updatedAt: String(Date.now()) };
    if (volume !== undefined) {
      fields.volume = String(volume);
    }

    await client.hSet(`playback:${userId}`, fields); 

    res.status(200).json({ songId, position, volume });
  } catch (error) {
    next(error);
  }
};

export const saveQueue = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const { queue } = req.body;

    if (
      !Array.isArray(queue) ||
      queue.length > MAX_QUEUE ||
      !queue.every((id) => typeof id === "string" && OBJECT_ID.test(id))
    ) {
      return res
        .status(400)
        .json({ message: `queue must be an array of up to ${MAX_QUEUE} song ids` });
    }

    await client.hSet(`playback:${userId}`, "queue", JSON.stringify(queue));

    res.status(200).json({ count: queue.length });
  } catch (error) {
    next(error);
  }
};