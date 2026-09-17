import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";
import { useEffect, useRef } from "react";

const POSITION_SAVE_INTERVAL_SECONDS = 5;

export default function AudioPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const prevSongRef = useRef<Song | null>(null);
	const pendingSeekRef = useRef<number | null>(null);
	const lastSavedTimeRef = useRef(0);
	const hasRestoredInitialPositionRef = useRef(false);

	const { currentSong, isPlaying, playNext, saveSongPosition, getSongPosition } = usePlayerStore();

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
		return () => audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
	}, []);

	// handle song changes
	useEffect(() => {
		if (!audioRef.current || !currentSong) return;

		const audio = audioRef.current;
		const isSongChange = prevSongRef.current?._id !== currentSong._id;

		if (isSongChange) {
			audio.src = currentSong.audioUrl;

			if (!hasRestoredInitialPositionRef.current) {
				pendingSeekRef.current = getSongPosition(currentSong._id);
			} else {
				pendingSeekRef.current = 0;
			}
			hasRestoredInitialPositionRef.current = true;

			prevSongRef.current = currentSong;
			lastSavedTimeRef.current = 0;

			if (isPlaying) audio.play();
		}
	}, [currentSong, isPlaying, getSongPosition]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleTimeUpdate = () => {
			if (!currentSong) return;
			if (audio.currentTime - lastSavedTimeRef.current >= POSITION_SAVE_INTERVAL_SECONDS) {
				saveSongPosition(currentSong._id, audio.currentTime);
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
			if (currentSong) saveSongPosition(currentSong._id, audio.currentTime);
		};

		audio.addEventListener("pause", handlePause);
		return () => audio.removeEventListener("pause", handlePause);
	}, [currentSong, saveSongPosition]);

	useEffect(() => {
		const handleBeforeUnload = () => {
			const audio = audioRef.current;
			if (audio && currentSong) saveSongPosition(currentSong._id, audio.currentTime);
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [currentSong, saveSongPosition]);

	useEffect(() => {
		return () => {
			const audio = audioRef.current;
			const song = prevSongRef.current;
			if (audio && song) saveSongPosition(song._id, audio.currentTime);
			usePlayerStore.setState({ isPlaying: false });
		};
	}, [saveSongPosition]);

	return <audio ref={audioRef} />;
};