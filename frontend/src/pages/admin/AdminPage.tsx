import { useEffect } from "react";
import { Navigate } from "react-router";
import { Music, ShieldCheck } from "lucide-react";

import { useAuthStore } from "./../../stores/useAuthStore";
import { useMusicStore } from "../../stores/useMusicStore.ts";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import RequestsTabContent from "./components/RequestsTabContent";

export default function AdminPage() {
  const { isAdmin, isSuperAdmin ,isLoading } = useAuthStore();
  const { fetchAlbums, fetchSongs, fetchStats } = useMusicStore();

  useEffect(() => {
    fetchAlbums();
    fetchSongs();
    fetchStats();
  }, [fetchAlbums, fetchSongs, fetchStats]);

  if (!isAdmin && isLoading) return <div>Unauthorized</div>;
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8"
    >
      <Header />
      <DashboardStats />

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList>
          <TabsTrigger
            value="songs"
            className="data-[state=active]:bg-zinc-700"
          >
            <Music className="mr-2 size-4" />
            Songs
          </TabsTrigger>

          <TabsTrigger
            value="albums"
            className="data-[state=active]:bg-zinc-700"
          >
            <Music className="mr-2 size-4" />
            Albums
          </TabsTrigger>

          {isSuperAdmin && (
            <TabsTrigger
              value="requests"
              className="data-[state=active]:bg-zinc-700"
            >
              <ShieldCheck className="mr-2 size-4" />
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="songs">
          <SongsTabContent />
        </TabsContent>

        {isSuperAdmin && (
        <TabsContent value="requests">
          <RequestsTabContent />
        </TabsContent>
      )}

        <TabsContent value="albums">
          <AlbumsTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
