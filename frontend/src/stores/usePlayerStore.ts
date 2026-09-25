import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import type { Song } from "../types/index.ts";
import { useChatStore } from "./useChatStore";

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  currentIndex: number;
  savedPositions: Record<string, number>;
  shouldResumeFromSaved: boolean;

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
  flushPlaybackState: (currentTime?: number) => Promise<void>;
  resetPlayback: () => void;
}

const socket = useChatStore.getState().socket;

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      queue: [],
      currentIndex: -1,
      savedPositions: {},
      shouldResumeFromSaved: false,

      initializeQueue: (songs: Song[]) => {
        set({
          queue: songs,
          currentSong: get().currentSong || songs[0],
          currentIndex: get().currentIndex == -1 ? 0 : get().currentIndex,
        });
      },
      playAlbum: (songs: Song[], startIndex = 0) => {
        if (songs.length === 0) return;
        const song = songs[startIndex];

        if (socket.auth) {
          socket.emit("update_activity", {
            userId: socket.auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        set({
          queue: songs,
          currentSong: song,
          currentIndex: startIndex,
          isPlaying: true,
          shouldResumeFromSaved: false,
        });
      },

      setCurrentSong: (song: Song | null) => {
        if (!song) return;

        if (socket.auth) {
          socket.emit("update_activity", {
            userId: socket.auth.userId,
            activity: `Playing ${song.title} by ${song.artist}`,
          });
        }

        const songIndex = get().queue.findIndex((s) => s._id === song._id);

        set({
          currentSong: song,
          isPlaying: true,
          currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
          shouldResumeFromSaved: false,
        });
      },

      togglePlay: () => {
        const willStartPlaying = !get().isPlaying;

        const currentSong = get().currentSong;

        if (socket.auth) {
          socket.emit("update_activity", {
            userId: socket.auth.userId,
            activity:
              willStartPlaying && currentSong
                ? `Playing ${currentSong.title} by ${currentSong.artist}`
                : "Idle",
          });
        }

        set({ isPlaying: !get().isPlaying });
      },

      playNext: () => {
        const { currentIndex, queue } = get();
        const nextIndex = currentIndex + 1;

        if (nextIndex < queue.length) {
          const nextSong = queue[nextIndex];

          if (socket.auth) {
            socket.emit("update_activity", {
              userId: socket.auth.userId,
              activity: `Playing ${nextSong.title} by ${nextSong.artist}`,
            });
          }

          set({
            currentSong: queue[nextIndex],
            currentIndex: nextIndex,
            isPlaying: true,
            shouldResumeFromSaved: false,
          });
        } else {
          set({ isPlaying: false });
        }
      },

      playPrevious: () => {
        const { currentIndex, queue } = get();
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
          const prevSong = queue[prevIndex];

          if (socket.auth) {
            socket.emit("update_activity", {
              userId: socket.auth.userId,
              activity: `Playing ${prevSong.title} by ${prevSong.artist}`
            })
          }

          set({
            currentSong: queue[prevIndex],
            currentIndex: prevIndex,
            isPlaying: true,
            shouldResumeFromSaved: false,
          });
        } else {
          set({ isPlaying: false });

          if (socket.auth) {
            socket.emit("update_activity", {
              userId: socket.auth.userId,
              activity: `Idle`
            })
          }
        }
      },

      saveSongPosition: (songId: string, time: number) => {
        set((state) => ({
          savedPositions: { ...state.savedPositions, [songId]: time },
        }));
      },

      getSongPosition: (songId: string) => {
        return get().savedPositions[songId] ?? 0;
      },

      hydrateFromServer: (song, position) => {
        if (get().currentSong) return;
        set({
          currentSong: song,
          isPlaying: false,
          shouldResumeFromSaved: true,
        });
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
        } catch (error: any) {
          console.error(error);
        }
      },

      syncPlaybackToServer: (songId, position) => {
        axiosInstance
          .put("/playback-state", { songId, position })
          .catch(() => {});
      },

      flushPlaybackState: async (currentTime?: number) => {
        const song = get().currentSong;
        if (!song) return;

        const position = currentTime ?? get().savedPositions[song._id] ?? 0;

        try {
          await axiosInstance.put("/playback-state", {
            songId: song._id,
            position,
          });
        } catch (error: any) {
          console.error(error);
        }
      },

      resetPlayback: () => {
        set({
          currentSong: null,
          isPlaying: false,
          queue: [],
          currentIndex: -1,
          shouldResumeFromSaved: false,
        });
      },
    }),
    {
      name: "playback-positions",
      partialize: (state) => ({ savedPositions: state.savedPositions }),
    },
  ),
);
