import client from '../lib/redis.js';
import { Song } from "../models/song.model.js";

export const getPlaybackState = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const state = await client.hGetAll(`playback:${userId}`);

    if (!state.songId) return res.status(200).json(null);

    const song = await Song.findById(state.songId);

    res.status(200).json({
      song,
      position: Number(state.position),
      volume: state.volume !== undefined ? Number(state.volume) : undefined,
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