import { useState } from "react";
import type { ReactNode } from "react";
import { useUser } from "@clerk/react";
import { Send } from "lucide-react";

import type { Song } from '../../../types/index.ts';
import { useChatStore } from '../../../stores/useChatStore.ts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog.tsx";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Avatar, AvatarImage } from "../../../components/ui/avatar";

export default function ShareSongDialog({ song, trigger }: { song: Song, trigger: ReactNode}) {
  const { user } = useUser();
  const { users, sendMessage } = useChatStore();
  const [open, setOpen] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  
  const handleShare = (receiverId: string) => {
    if (!user) return;

    sendMessage(receiverId, user.id, "", song._id)
    setSentTo(receiverId);
    setTimeout(() => {
      setOpen(false);
      setSentTo(null);
    }, 600)
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Send "{song.title}" to</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-1 pr-2">
            {users.map((friend) => (
              <button
                key={friend.clerkId}
                onClick={() => handleShare(friend.clerkId)}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition-colors text-left"
              >
                <Avatar className="size-9">
                  <AvatarImage src={friend.imageUrl} />
                </Avatar>
                <span className="text-sm font-medium flex-1 truncate">{friend.fullName}</span>
                {sentTo === friend.clerkId ? (
                  <span className="text-xs text-violet-400">Sent</span>
                ) : (
                  <Send className="size-4 text-zinc-400" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}