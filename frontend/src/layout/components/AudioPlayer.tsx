import { useAuth } from "@clerk/react";
import { setAxiosAuthToken } from "../../lib/axios.ts";

import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";
import { useEffect, useRef } from "react";

const POSITION_SAVE_INTERVAL_SECONDS = 5;

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const prevSongRef = useRef<Song | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const lastSavedTimeRef = useRef(0);
  const { isSignedIn, getToken } = useAuth();

  const {
    currentSong,
    isPlaying,
    playNext,
    saveSongPosition,
    getSongPosition,
    syncPlaybackToServer,
    fetchLastPlayback,
    shouldResumeFromSaved,
  } = usePlayerStore();

  useEffect(() => {
    if (!isSignedIn) return;
    setAxiosAuthToken(getToken);
    fetchLastPlayback();
  }, [isSignedIn, getToken, fetchLastPlayback]);

  useEffect(() => {
    if (isPlaying) audioRef.current?.play();
    else audioRef.current?.pause();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      if (currentSong) saveSongPosition(currentSong._id, 0);
      playNext();
    };

    audio?.addEventListener("ended", handleEnded);
    return () => audio?.removeEventListener("ended", handleEnded);
  }, [playNext, currentSong, saveSongPosition]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  // handle song changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;
    const isSongChange = prevSongRef.current?._id !== currentSong._id;

    if (isSongChange) {
      audio.src = currentSong.audioUrl;

      pendingSeekRef.current = shouldResumeFromSaved
        ? getSongPosition(currentSong._id)
        : 0;

      prevSongRef.current = currentSong;
      lastSavedTimeRef.current = 0;

      if (isPlaying) audio.play();
    }
  }, [currentSong, isPlaying, shouldResumeFromSaved, getSongPosition]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!currentSong) return;
      if (
        audio.currentTime - lastSavedTimeRef.current >=
        POSITION_SAVE_INTERVAL_SECONDS
      ) {
        saveSongPosition(currentSong._id, audio.currentTime);
        if (isSignedIn) {
          syncPlaybackToServer(currentSong._id, audio.currentTime);
        }
        lastSavedTimeRef.current = audio.currentTime;
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [currentSong, saveSongPosition]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePause = () => {
      if (!currentSong) return;
      saveSongPosition(currentSong._id, audio.currentTime);

      if (isSignedIn) {
        syncPlaybackToServer(currentSong._id, audio.currentTime);
      }
    };

    audio.addEventListener("pause", handlePause);
    return () => audio.removeEventListener("pause", handlePause);
  }, [currentSong, saveSongPosition]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      if (!audio || !currentSong) return;

      saveSongPosition(currentSong._id, audio.currentTime);

      if (isSignedIn) {
        const payload = JSON.stringify({
          songId: currentSong._id,
          position: audio.currentTime,
        });
        navigator.sendBeacon(
          "http://localhost:5000/api/playback-state",
          new Blob([payload], { type: "application/json" }),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentSong, saveSongPosition]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      const song = prevSongRef.current;
      if (audio && song) {
        saveSongPosition(song._id, audio.currentTime);

        if (isSignedIn) {
          syncPlaybackToServer(song._id, audio.currentTime);
        }
      }
      usePlayerStore.setState({ isPlaying: false });
    };
  }, [saveSongPosition, isSignedIn, syncPlaybackToServer]);

  useEffect(() => {
  const handleFlushRequest = () => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      saveSongPosition(currentSong._id, audio.currentTime);
      usePlayerStore.getState().flushPlaybackState(audio.currentTime);
    }
  };

  window.addEventListener("playback:flush", handleFlushRequest);
  return () => window.removeEventListener("playback:flush", handleFlushRequest);
}, [currentSong, saveSongPosition]);

  return <audio ref={audioRef} />;
}
