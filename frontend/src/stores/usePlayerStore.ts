import toast from "react-hot-toast";
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
  volume: number;
  isQueueOpen: boolean;

  initializeQueue: (song: Song[]) => void;
  playAlbum: (song: Song[], startIndex?: number) => void;
  setCurrentSong: (song: Song | null) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  saveSongPosition: (songId: string, time: number) => void;
  getSongPosition: (songId: string) => number;
  hydrateFromServer: (song: Song, position: number, volume?: number) => void;
  fetchLastPlayback: () => Promise<void>;
  syncPlaybackToServer: (
    songId: string,
    position: number,
    volume?: number,
  ) => void;
  flushPlaybackState: (currentTime?: number) => Promise<void>;
  resetPlayback: () => void;
  toggleQueue: () => void;
  addToQueue: (song: Song) => void;
  playNextInQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

const socket = useChatStore.getState().socket;

const seed = (
  s: Pick<PlayerStore, "queue" | "currentIndex" | "currentSong">,
) =>
  s.queue.length > 0
    ? { queue: s.queue, currentIndex: s.currentIndex }
    : {
        queue: s.currentSong ? [s.currentSong] : [],
        currentIndex: s.currentSong ? 0 : -1,
      };

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      queue: [],
      currentIndex: -1,
      savedPositions: {},
      shouldResumeFromSaved: false,
      volume: 75,
      isQueueOpen: false,

      toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),

      setVolume: (volume) => set({ volume }),

      initializeQueue: (songs: Song[]) => {
        if (get().queue.length > 0) {
          return;
        }

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
              activity: `Playing ${prevSong.title} by ${prevSong.artist}`,
            });
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
              activity: `Idle`,
            });
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

      hydrateFromServer: (song, position, volume) => {
        if (get().currentSong) return;

        const idx = get().queue.findIndex((s) => s._id === song._id);

        set({
          currentSong: song,
          ...(idx !== -1 
            ? { currentIndex: idx }
            : { queue: [song], currentIndex: 0 }
          ),
          isPlaying: false,
          shouldResumeFromSaved: true,
          ...(volume !== undefined && { volume }),
        });
        get().saveSongPosition(song._id, position);
      },

      fetchLastPlayback: async () => {
        if (get().currentSong) return;
        try {
          const response = await axiosInstance.get("/playback-state");
          if (response.data) {
            const { song, position, volume, queue } = response.data;

            if (Array.isArray(queue) && queue.length > 0) {
              set({ queue });
            }

            get().hydrateFromServer(song, position, volume);
          }
        } catch (error: any) {
          console.error(error);
        }
      },

      syncPlaybackToServer: (songId, position, volume) => {
        axiosInstance
          .put("/playback-state", {
            songId,
            position,
            volume: volume ?? get().volume,
          })
          .catch(() => {});
      },

      flushPlaybackState: async (currentTime) => {
        const song = get().currentSong;
        if (!song) return;
        const position = currentTime ?? get().savedPositions[song._id] ?? 0;
        try {
          await axiosInstance.put("/playback-state", {
            songId: song._id,
            position,
            volume: get().volume,
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

      addToQueue: (song) => {
        const state = get();
        const { queue, currentIndex } = seed(state);

        if (queue.some((s) => s._id === song._id)) {
          toast("Already in queue");
          return;
        }

        const next = [ ...queue, song];
        const idx = Math.max(currentIndex, 0);

        set({
          queue: next,
          currentIndex: idx,
          currentSong: state.currentSong ?? next[idx],
        });

        toast.success("Added to queue");
      },

      playNextInQueue: (song) => {
        const state = get();

        if (state.currentSong?._id === song._id) {
          toast("Already playing");
          return;
        }

        let { queue, currentIndex } = seed(state);
        const existing = queue.findIndex((s) => s._id === song._id);

        if (existing !== -1) {
          queue = queue.filter((_, i) => i !== existing);

          if (existing < currentIndex) {
            currentIndex -= 1;
          }
        }

        const insertAt = currentIndex + 1;
        const next = [...queue.slice(0, insertAt), song, ...queue.slice(insertAt)];
        const idx = Math.max(currentIndex, 0);

        set({
          queue: next,
          currentIndex: idx,
          currentSong: state.currentSong ?? next[idx]
        });
        
        toast.success('Will play next');
      },

      removeFromQueue: (index) => {
        const { queue, currentIndex } = get();

        if (index > 0 || index >= queue.length || index === currentIndex) {
          return;
        }

        set({
          queue: queue.filter((_, i) => i !== index),
          currentIndex: index < currentIndex ? currentIndex -1 : currentIndex
        });
      },

      clearQueue: () => {
        const { currentSong} = get();

        set({
          queue: currentSong ? [currentSong] : [],
          currentIndex: currentSong ? 0 : -1
        })
      },
    }),
    {
      name: "playback-positions",
      partialize: (state) => ({
        savedPositions: state.savedPositions,
        volume: state.volume,
        queue: state.queue,
        currentIndex: state.currentIndex
      }),
    },
  ),
);

let queueSyncTimer: ReturnType<typeof setTimeout> | undefined;

usePlayerStore.subscribe((state, prev) => {
  if (state.queue === prev.queue) return;

  // not syncing an empty queue
  if (state.queue.length === 0) return;

  clearTimeout(queueSyncTimer);
  queueSyncTimer = setTimeout(async () => {
    try {
      await axiosInstance.put("/playback-state/queue", {
        queue: state.queue.slice(0, 200).map((s) => s._id)
      });
    } catch {
      // pass
    }
  }, 800)
})