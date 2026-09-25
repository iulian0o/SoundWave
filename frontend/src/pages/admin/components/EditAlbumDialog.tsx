import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.tsx";
import { Input } from "../../../components/ui/input";
import { useMusicStore } from "../../../stores/useMusicStore";
import type { Album } from "../../../types";

export default function EditAlbumDialog({ album }: { album: Album }) {
  const { updateAlbum } = useMusicStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(album.title);
  const [releaseYear, setReleaseYear] = useState(album.releaseYear);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    await updateAlbum(album._id, { title, releaseYear });
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription>
            Update the title or release year
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Album Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            ></Input>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Album</label>
            <Input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(parseInt(e.target.value))}
              className="bg-zinc-8-- border-zinc-700"
              min={1900}
              max={new Date().getFullYear()}
            ></Input>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
