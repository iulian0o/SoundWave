import { Album } from '../models/album.model.js';
import { Song } from '../models/song.model.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const search = async (req, res, next) => {
  try {
    const q = (req.query.q ?? '').toString().trim().slice(0, 50);
    if (!q) return res.status(200).json([]);

    const safe = escapeRegex(q);
    const contains = new RegExp(safe, 'i');
    const prefix = new RegExp(`^${safe}`, 'i');
    const filter = { $or: [{ title: contains }, { artist: contains }] };

    const [albums, songs] = await Promise.all([
      Album.find(filter).select('title artist imageUrl').limit(20).lean(),
      Song.find({ ...filter, albumId: { $ne: null } })
        .select('title artist imageUrl albumId')
        .limit(20)
        .lean(),
    ]);

    const rank = (r) => (prefix.test(r.title) ? 0 : prefix.test(r.artist) ? 1 : 2);

    const results = [
      ...albums.map((a) => ({ ...a, type: 'album' })),
      ...songs.map((s) => ({ ...s, type: 'song' })),
    ]
      .sort((a, b) => rank(a) - rank(b)) 
      .slice(0, 6);

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};