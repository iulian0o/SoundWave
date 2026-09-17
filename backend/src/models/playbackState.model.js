import mongoose from 'mongoose';

const playbackStateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
  },
  position: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

export const PlaybackState = mongoose.model("PlaybackState", playbackStateSchema);