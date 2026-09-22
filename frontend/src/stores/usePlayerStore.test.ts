import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePlayerStore } from "./usePlayerStore.ts";

vi.hoisted(() => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: () => null,
    get length() {
      return store.size;
    },
  } as unknown as Storage;
});



vi.mock("../lib/axios.ts", () => ({
  axiosInstance: { get: vi.fn(), put: vi.fn() },
}));

const song = (id: string) => ({ _id: id, title: `Song ${id}` }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  usePlayerStore.setState({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    savedPositions: {},
    shouldResumeFromSaved: false,
  });
});

describe("usePlayerStore", () => {
  it("playAlbum starts playback at the given track", () => {
    const songs = [song("1"), song("2"), song("3")];

    usePlayerStore.getState().playAlbum(songs, 1);

    expect(usePlayerStore.getState().currentSong).toEqual(songs[1]);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it("resetPlayback clears playback state but keeps saved positions", () => {
    usePlayerStore.setState({
      currentSong: song("1"),
      isPlaying: true,
      queue: [song("1")],
      currentIndex: 0,
      savedPositions: { "1": 20 },
    });

    usePlayerStore.getState().resetPlayback();

    const state = usePlayerStore.getState();
    expect(state.currentSong).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.savedPositions).toEqual({ "1": 20 });
  });
});