import { Play, Pause } from "lucide-react"

import type { Song } from "../../../types/index.ts"
import { Button } from "../../../components/ui/button"
import { usePlayerStore } from "../../../stores/usePlayerStore.ts"

type PlayButtonProps = {
  song: Song,
  songs?: Song[],
  index?: number,
}

export default function PlayButton({song, songs, index = 0}: PlayButtonProps ) {
  const {currentSong, isPlaying, playAlbum, setCurrentSong, togglePlay} = usePlayerStore();
  const isCurrentSong = currentSong?._id === song._id;

  const handlePlay = () => {
    if (isCurrentSong) togglePlay();
    else if (songs) playAlbum(songs, index);
    else setCurrentSong(song);
  }

  return (
    <Button 
      size="icon"
      onClick={handlePlay} 
      className={`absolute bottom-3 right-2 bg-green-500 hover:bg-green-400 hover:scale-105 transition-all 
				opacity-0 translate-y-2 group-hover:translate-y-0 ${
					isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
				}`}
      > {isCurrentSong && isPlaying ? (
          <Pause className="size-5 text-black" />
      ) : (
        <Play className="size-5 text-black" />
      )}
    </Button>
  )
}