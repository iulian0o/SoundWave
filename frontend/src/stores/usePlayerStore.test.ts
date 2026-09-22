import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePlayerStore } from "./usePlayerStore.ts";
import { axiosInstance } from "../lib/axios.ts";

vi.mock("../lib/axios.ts", () => ({
  axiosInstance: { get: vi.fn(), put: vi.fn() },
}));

const song = (id: string) => ({ _id: id, title: `Song ${id}` }) as any;

const resetStore = () => {
  usePlayerStore.setState({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    savedPositions: {},
    shouldResumeFromSaved: false,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  resetStore();
});

describe("usePlayerStore", () => {
  describe("initializeQueue", () => {
    it("sets the queue and defaults to the first song when nothing is playing", () => {
      const songs = [song("1"), song("2")];

      usePlayerStore.getState().initializeQueue(songs);

      expect(usePlayerStore.getState().queue).toEqual(songs);
      expect(usePlayerStore.getState().currentSong).toEqual(songs[0]);
      expect(usePlayerStore.getState().currentIndex).toBe(0);
    });

    it("keeps the current song and index when playback is already underway", () => {
      const songs = [song("1"), song("2")];
      usePlayerStore.setState({ currentSong: song("2"), currentIndex: 1 });

      usePlayerStore.getState().initializeQueue(songs);

      expect(usePlayerStore.getState().currentSong).toEqual(song("2"));
      expect(usePlayerStore.getState().currentIndex).toBe(1);
    });
  });

  describe("playAlbum", () => {
    it("starts playback at the given index", () => {
      const songs = [song("1"), song("2"), song("3")];

      usePlayerStore.getState().playAlbum(songs, 2);

      expect(usePlayerStore.getState().queue).toEqual(songs);
      expect(usePlayerStore.getState().currentSong).toEqual(songs[2]);
      expect(usePlayerStore.getState().currentIndex).toBe(2);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      expect(usePlayerStore.getState().shouldResumeFromSaved).toBe(false);
    });

    it("defaults to the first track when no index is given", () => {
      const songs = [song("1"), song("2")];

      usePlayerStore.getState().playAlbum(songs);

      expect(usePlayerStore.getState().currentIndex).toBe(0);
      expect(usePlayerStore.getState().currentSong).toEqual(songs[0]);
    });

    it("does nothing for an empty album", () => {
      usePlayerStore.getState().playAlbum([]);

      expect(usePlayerStore.getState().queue).toEqual([]);
      expect(usePlayerStore.getState().currentSong).toBeNull();
    });
  });

  describe("setCurrentSong", () => {
    it("ignores a null song", () => {
      usePlayerStore.setState({ currentSong: song("1") });

      usePlayerStore.getState().setCurrentSong(null);

      expect(usePlayerStore.getState().currentSong).toEqual(song("1"));
    });

    it("updates currentIndex when the song is in the queue", () => {
      const songs = [song("1"), song("2"), song("3")];
      usePlayerStore.setState({ queue: songs });

      usePlayerStore.getState().setCurrentSong(songs[2]);

      expect(usePlayerStore.getState().currentSong).toEqual(songs[2]);
      expect(usePlayerStore.getState().currentIndex).toBe(2);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it("keeps the previous index when the song isn't in the queue", () => {
      usePlayerStore.setState({ queue: [song("1")], currentIndex: 0 });

      usePlayerStore.getState().setCurrentSong(song("99"));

      expect(usePlayerStore.getState().currentIndex).toBe(0);
    });
  });

  describe("togglePlay", () => {
    it("flips isPlaying", () => {
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(true);

      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });
  });

  describe("playNext / playPrevious", () => {
    const songs = [song("1"), song("2"), song("3")];

    it("advances to the next track", () => {
      usePlayerStore.setState({ queue: songs, currentIndex: 0 });

      usePlayerStore.getState().playNext();

      expect(usePlayerStore.getState().currentIndex).toBe(1);
      expect(usePlayerStore.getState().currentSong).toEqual(songs[1]);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it("stops playback at the end of the queue", () => {
      usePlayerStore.setState({
        queue: songs,
        currentIndex: 2,
        currentSong: songs[2],
        isPlaying: true,
      });

      usePlayerStore.getState().playNext();

      expect(usePlayerStore.getState().currentIndex).toBe(2);
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it("goes back to the previous track", () => {
      usePlayerStore.setState({ queue: songs, currentIndex: 1 });

      usePlayerStore.getState().playPrevious();

      expect(usePlayerStore.getState().currentIndex).toBe(0);
      expect(usePlayerStore.getState().currentSong).toEqual(songs[0]);
      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it("stops playback when already at the start of the queue", () => {
      usePlayerStore.setState({ queue: songs, currentIndex: 0, isPlaying: true });

      usePlayerStore.getState().playPrevious();

      expect(usePlayerStore.getState().currentIndex).toBe(0);
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });
  });

  describe("saveSongPosition / getSongPosition", () => {
    it("stores and retrieves a song's saved position", () => {
      usePlayerStore.getState().saveSongPosition("1", 42);

      expect(usePlayerStore.getState().getSongPosition("1")).toBe(42);
    });

    it("returns 0 for a song with no saved position", () => {
      expect(usePlayerStore.getState().getSongPosition("unknown")).toBe(0);
    });
  });

  describe("hydrateFromServer", () => {
    it("sets the current song from the server and saves its position", () => {
      usePlayerStore.getState().hydrateFromServer(song("1"), 30);

      expect(usePlayerStore.getState().currentSong).toEqual(song("1"));
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      expect(usePlayerStore.getState().shouldResumeFromSaved).toBe(true);
      expect(usePlayerStore.getState().getSongPosition("1")).toBe(30);
    });

    it("does nothing if a song is already playing", () => {
      usePlayerStore.setState({ currentSong: song("existing") });

      usePlayerStore.getState().hydrateFromServer(song("1"), 30);

      expect(usePlayerStore.getState().currentSong).toEqual(song("existing"));
    });
  });

  describe("fetchLastPlayback", () => {
    it("hydrates from the server response when there's no current song", async () => {
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: { song: song("1"), position: 15 },
      });

      await usePlayerStore.getState().fetchLastPlayback();

      expect(axiosInstance.get).toHaveBeenCalledWith("/playback-state");
      expect(usePlayerStore.getState().currentSong).toEqual(song("1"));
      expect(usePlayerStore.getState().shouldResumeFromSaved).toBe(true);
    });

    it("does nothing when the server has no saved playback state", async () => {
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: null });

      await usePlayerStore.getState().fetchLastPlayback();

      expect(usePlayerStore.getState().currentSong).toBeNull();
    });

    it("skips the request entirely when a song is already loaded", async () => {
      usePlayerStore.setState({ currentSong: song("existing") });

      await usePlayerStore.getState().fetchLastPlayback();

      expect(axiosInstance.get).not.toHaveBeenCalled();
    });

    it("swallows request errors without throwing", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error("Network Error"));

      await expect(usePlayerStore.getState().fetchLastPlayback()).resolves.toBeUndefined();
      expect(usePlayerStore.getState().currentSong).toBeNull();
    });
  });

  describe("syncPlaybackToServer", () => {
    it("puts the playback position to the server", () => {
      vi.mocked(axiosInstance.put).mockResolvedValueOnce({});

      usePlayerStore.getState().syncPlaybackToServer("1", 12);

      expect(axiosInstance.put).toHaveBeenCalledWith("/playback-state", {
        songId: "1",
        position: 12,
      });
    });

    it("does not throw when the request fails", () => {
      vi.mocked(axiosInstance.put).mockRejectedValueOnce(new Error("down"));

      expect(() => usePlayerStore.getState().syncPlaybackToServer("1", 12)).not.toThrow();
    });
  });

  describe("flushPlaybackState", () => {
    it("does nothing when there's no current song", async () => {
      await usePlayerStore.getState().flushPlaybackState();

      expect(axiosInstance.put).not.toHaveBeenCalled();
    });

    it("flushes the given position when provided explicitly", async () => {
      usePlayerStore.setState({ currentSong: song("1") });
      vi.mocked(axiosInstance.put).mockResolvedValueOnce({});

      await usePlayerStore.getState().flushPlaybackState(77);

      expect(axiosInstance.put).toHaveBeenCalledWith("/playback-state", {
        songId: "1",
        position: 77,
      });
    });

    it("falls back to the saved position when no explicit time is given", async () => {
      usePlayerStore.setState({ currentSong: song("1"), savedPositions: { "1": 55 } });
      vi.mocked(axiosInstance.put).mockResolvedValueOnce({});

      await usePlayerStore.getState().flushPlaybackState();

      expect(axiosInstance.put).toHaveBeenCalledWith("/playback-state", {
        songId: "1",
        position: 55,
      });
    });

    it("falls back to 0 when neither a time nor a saved position exists", async () => {
      usePlayerStore.setState({ currentSong: song("1") });
      vi.mocked(axiosInstance.put).mockResolvedValueOnce({});

      await usePlayerStore.getState().flushPlaybackState();

      expect(axiosInstance.put).toHaveBeenCalledWith("/playback-state", {
        songId: "1",
        position: 0,
      });
    });

    it("swallows request errors without throwing", async () => {
      usePlayerStore.setState({ currentSong: song("1") });
      vi.mocked(axiosInstance.put).mockRejectedValueOnce(new Error("down"));

      await expect(usePlayerStore.getState().flushPlaybackState(5)).resolves.toBeUndefined();
    });
  });

  describe("resetPlayback", () => {
    it("resets playback fields but keeps saved positions", () => {
      usePlayerStore.setState({
        currentSong: song("1"),
        isPlaying: true,
        queue: [song("1")],
        currentIndex: 0,
        shouldResumeFromSaved: true,
        savedPositions: { "1": 20 },
      });

      usePlayerStore.getState().resetPlayback();

      const state = usePlayerStore.getState();
      expect(state.currentSong).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.queue).toEqual([]);
      expect(state.currentIndex).toBe(-1);
      expect(state.shouldResumeFromSaved).toBe(false);
      expect(state.savedPositions).toEqual({ "1": 20 });
    });
  });
});