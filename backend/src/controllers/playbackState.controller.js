import { PlaybackState } from '../models/playbackState.model.js';

export const getPlaybackState = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const state = await PlaybackState.findOne({ userId }).populate('songId');

    if (!state) return res.status(200).json(null);

    res.status(200).json({
      song: state.songId,
      position: state.position,
    });
  } catch (error) {
    next(error);
  }
};

export const savePlaybackState = async (req, res, next) => {
  try {
    const { userId } = req.auth();
    const { songId, position } = req.body;

    if (!songId || typeof position !== "number") {
      return res.status(400).json({ message: "songId and position are required" });
    }

    const state = await PlaybackState.findOneAndUpdate(
      { userId },
      { songId, position },
      { upsert: true, new: true }
    );

    res.status(200).json(state);
  } catch (error) {
    next(error);
  }
};