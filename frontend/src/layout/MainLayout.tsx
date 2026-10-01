import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import { Outlet } from "react-router";
import { useState, useEffect, useRef } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

import { usePlayerStore } from "../stores/usePlayerStore.ts";

import LeftSidebar from "./components/LeftSidebar";
import FriendsActivity from "./components/FriendsActivity";
import AudioPlayer from "./components/AudioPlayer";
import PlaybackControlls from "./components/PlaybackControlls";
import QueuePanel from "./components/QueuePanel";

export default function MainLayout() {
  const [isMobile, setIsMobile] = useState(false);

  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);

  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (isQueueOpen && rightPanelRef.current?.getSize() === 0) {
      rightPanelRef.current.resize(20);
    }
  }, [isQueueOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 flex h-full overflow-hidden p-2"
      >
        <AudioPlayer />
        {/* Left sidebar */}
        <ResizablePanel
          defaultSize={20}
          minSize={isMobile ? 0 : 10}
          maxSize={30}
        >
          <LeftSidebar />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

        {/* Main content */}
        <ResizablePanel defaultSize={isMobile ? 80 : 60}>
          <Outlet />
        </ResizablePanel>

        {!isMobile && (
          <>
            <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />
            {/* right sidebar */}
            <ResizablePanel
              defaultSize={20}
              minSize={0}
              maxSize={25}
              collapsedSize={0}
            >
              {isQueueOpen ? <QueuePanel /> : <FriendsActivity />}
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <PlaybackControlls />
    </div>
  );
}
