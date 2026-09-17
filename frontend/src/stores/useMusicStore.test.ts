import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMusicStore } from "./useMusicStore";
import { axiosInstance } from "../lib/axios";

vi.mock("../lib/axios", () => ({
  axiosInstance: { get: vi.fn(), delete: vi.fn()}
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn()}
}));

const INITIAL_STATE = {
  albums: [],
  songs: [],
  isLoading: false,
  error: null,
  currentAlbum: null,
  featuredSongs: [],
  madeForYouSongs: [],
  trendingSongs: [],
  stats: { totalSongs: 0, totalAlbums: 0, totalUsers: 0, totalArtists: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  useMusicStore.setState(INITIAL_STATE);
});

describe("useMusicStore: fetch songs", () => {
  it("fetchAlbums populates albums on success", async () => {
    const albums = [{ _id: "a1", title: "Album One" }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: albums });

    await useMusicStore.getState().fetchAlbums();

    expect(axiosInstance.get).toHaveBeenCalledWith("/albums");
    expect(useMusicStore.getState().albums).toEqual(albums);
  });

  it("fetchSongs populates songs on success", async () => {
    const songs = [{ _id: "s1", title: "Song One" }];
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: songs });

    await useMusicStore.getState().fetchSongs();

    expect(axiosInstance.get).toHaveBeenCalledWith("/songs");
    expect(useMusicStore.getState().songs).toEqual(songs);
  });

  it("fetchStats populates stats on success", async () => {
    const stats = { totalSongs: 10, totalAlbums: 2, totalUsers: 5, totalArtists: 3 };
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: stats });

    await useMusicStore.getState().fetchStats();

    expect(useMusicStore.getState().stats).toEqual(stats);
  });

  it("records the server error message when a fetch is rejected with a response", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValueOnce({
      response: { data: { message: "Failed to load albums" } },
    });

    await useMusicStore.getState().fetchAlbums();

    expect(useMusicStore.getState().error).toBe("Failed to load albums");
  });

  it("throws on a response-less network error (same crash-prone pattern)", async () => {
    vi.mocked(axiosInstance.get).mockRejectedValueOnce(new Error("Network Error"));

    await expect(useMusicStore.getState().fetchFeaturedSongs()).rejects.toThrow();
  });
});

describe("useMusicStore - deleteSong", () => {
  it("removes the song from state and calls the correct endpoint", async () => {
    useMusicStore.setState({ songs: [{ _id: "s1" }, { _id: "s2" }] as any });
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: {} });

    await useMusicStore.getState().deleteSong("s1");

    expect(axiosInstance.delete).toHaveBeenCalledWith("/admin/songs/s1");
    expect(useMusicStore.getState().songs.map((s) => s._id)).toEqual(["s2"]);
  });
});

describe("useMusicStore - deleteAlbum", () => {
  it("removes the album from state and calls the correct endpoint", async () => {
    useMusicStore.setState({
      albums: [{ _id: "al1", title: "Album One" }, { _id: "al2", title: "Album Two" }] as any,
      songs: [],
    });
    vi.mocked(axiosInstance.delete).mockResolvedValueOnce({ data: {} });

    await useMusicStore.getState().deleteAlbum("al1");

    expect(axiosInstance.delete).toHaveBeenCalledWith("/admin/albums/al1");
    expect(useMusicStore.getState().albums.map((a) => a._id)).toEqual(["al2"]);
  });
});