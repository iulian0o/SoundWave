import { ListMusic, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";

type QueueRowProps = {
  song: Song;
  isCurrent?: boolean;
  onPlay: () => void;
  onRemove?: () => void;
};

function QueueRow({ song, isCurrent, onPlay, onRemove }: QueueRowProps) {
  return (
    <div
      onClick={onPlay}
      className="group flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-zinc-800/50 transition-colors"
    >
      <img
        src={song.imageUrl}
        alt={song.title}
        className="size-10 rounded object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-medium truncate",
            isCurrent ? "text-violet-400" : "text-white",
          )}
        >
          {song.title}
        </div>
        <div className="text-xs text-zinc-400 truncate">{song.artist}</div>
      </div>

      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Remove ${song.title} from queue`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="size-7 shrink-0 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export default function QueuePanel() {
  const {
    queue,
    currentIndex,
    setCurrentSong,
    togglePlay,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  const nowPlaying = currentIndex >= 0 ? queue[currentIndex] : null;
  const upcomingStart = currentIndex + 1;
  const upcoming = queue.slice(upcomingStart);

  return (
    <div className="h-full bg-zinc-900 rounded-lg flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ListMusic className="size-5 shrink-0" />
          <h2>Queue</h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearQueue}
          disabled={queue.length <= 1}
          className="text-zinc-400 hover:text-white"
        >
          Clear
        </Button>
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
          <ListMusic className="size-8 text-zinc-500" />
          <p className="font-medium text-white">Queue is empty</p>
          <p className="text-sm text-zinc-400">
            Play an album or add songs from the ⋯ menu.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {nowPlaying && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                  Now playing
                </h3>
                <QueueRow song={nowPlaying} isCurrent onPlay={togglePlay} />
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
                  Next up
                </h3>
                <div className="space-y-1">
                  {upcoming.map((song, i) => (
                    <QueueRow
                      key={song._id}
                      song={song}
                      onPlay={() => setCurrentSong(song)}
                      onRemove={() => removeFromQueue(upcomingStart + i)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}