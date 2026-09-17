import { create } from "zustand"
import { persist } from "zustand/middleware"
import { axiosInstance } from "../lib/axios"
import type { Song } from "../types/index.ts"

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  savedPositions: Record<string, number>;

  initializeQueue: (song: Song[]) => void;
  playAlbum: (song: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  saveSongPosition: (songId: string, time: number) => void;
  getSongPosition: (songId: string) => number;

  hydrateFromServer: (song: Song, position: number) => void;
  fetchLastPlayback: () => Promise<void>;
  syncPlaybackToServer: (songId: string, position: number) => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      queue: [],
      currentIndex: -1,
      savedPositions: {},

      initializeQueue: (songs: Song[]) => {
        set({
          queue: songs,
          currentSong: get().currentSong || songs[0],
          currentIndex: get().currentIndex == -1 ? 0 : get().currentIndex
        })
      },
      playAlbum: (songs: Song[], startIndex = 0) => {
        if (songs.length === 0) return;
        const song = songs[startIndex];
        set({ queue: songs, currentSong: song, currentIndex: startIndex, isPlaying: true })
      },

      setCurrentSong: (song: Song | null) => {
        if (!song) return;
        const songIndex = get().queue.findIndex(s => s._id === song._id);
        set({
          currentSong: song,
          isPlaying: true,
          currentIndex: songIndex !== -1 ? songIndex : get().currentIndex
        });
      },

      togglePlay: () => {
        set({ isPlaying: !get().isPlaying });
      },

      playNext: () => {
        const { currentIndex, queue } = get();
        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          set({ currentSong: queue[nextIndex], currentIndex: nextIndex, isPlaying: true });
        } else {
          set({ isPlaying: false });
        }
      },

      playPrevious: () => {
        const { currentIndex, queue } = get();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          set({ currentSong: queue[prevIndex], currentIndex: prevIndex, isPlaying: true });
        } else {
          set({ isPlaying: false });
        }
      },

      saveSongPosition: (songId: string, time: number) => {
        set((state) => ({
          savedPositions: { ...state.savedPositions, [songId]: time }
        }));
      },

      getSongPosition: (songId: string) => {
        return get().savedPositions[songId] ?? 0;
      },

      hydrateFromServer: (song, position) => {
        if (get().currentSong) return;
        set({ currentSong: song, isPlaying: false });
        get().saveSongPosition(song._id, position);
      },

      fetchLastPlayback: async () => {
        if (get().currentSong) return;
        try {
          const response = await axiosInstance.get("/playback-state");
          if (response.data) {
            const { song, position } = response.data;
            get().hydrateFromServer(song, position);
          }
        } catch {
          // non-critical, fail silently
        }
      },

      syncPlaybackToServer: (songId, position) => {
        axiosInstance.put("/playback-state", { songId, position }).catch(() => {});
      },
    }),
    {
      name: "playback-positions", 
      partialize: (state) => ({ savedPositions: state.savedPositions }),
    }
  )
)