import { ListEnd, ListStart, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { cn } from "../lib/utils";
import { usePlayerStore } from "../stores/usePlayerStore.ts";
import type { Song } from "../types/index.ts";

type SongMenuProps = {
  song: Song;
  className?: string;
};

export default function SongMenu({ song, className }: SongMenuProps) {
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNextInQueue = usePlayerStore((s) => s.playNextInQueue);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Song options"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "z-10 rounded-full bg-zinc-800/90 p-2 text-white transition-opacity hover:bg-zinc-700",
          "opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100 max-sm:opacity-100",
          className,
        )}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => playNextInQueue(song)}>
          <ListStart className="size-4" />
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addToQueue(song)}>
          <ListEnd className="size-4" />
          Add to queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}