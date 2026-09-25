import { Link } from "react-router";
import { LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import { Show, UserButton, useClerk } from "@clerk/react";
import { useAuthStore } from './../stores/useAuthStore';
import { usePlayerStore } from "../stores/usePlayerStore.ts";
import { cn } from "../lib/utils.ts";
import { buttonVariants, Button } from "./ui/button";
import SignInOAuthButtons from "./SignInOAuthButtons";

export default function TopBar() {
  const { isAdmin } = useAuthStore();
  const { signOut } = useClerk();
  const resetPlayback = usePlayerStore((state) => state.resetPlayback);

  const handleSignOut = async () => {
    window.dispatchEvent(new Event("playback:flush"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    await signOut();

    resetPlayback();
  }

  return (
    <div
      className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75
      backdrop-blur-md z-10"
    >
      <div className="flex gap-2 items-center">
        <img src="/SoundWave.png" className="size-8" alt="SoundWave logo"/>
          SoundWave
        </div>
      <div className="flex items-center gap-4">
        {isAdmin && (
          <Link to={"/admin"} className={cn(buttonVariants({ variant: "outline"}))}>
            <LayoutDashboardIcon className="size-4 mr-2" />
            Admin Dashboard
          </Link>
        )}

        <Show when="signed-out">
          <SignInOAuthButtons />
        </Show>

        <Show when="signed-in">
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOutIcon className="size-4" />
          </Button>
        </Show>

        <UserButton />
      </div>
    </div>
  );
}