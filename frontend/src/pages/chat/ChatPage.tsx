import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useChatStore } from "../../stores/useChatStore.ts";
import TopBar from "../../components/TopBar";
import UserList from "./components/UserList"

export default function ChatPage() {
  const { user } = useUser();
  const { /* messages */ selectedUser, fetchUsers, fetchMessages } = useChatStore();

  useEffect(() => {
    if (user) fetchUsers();
  }, [fetchUsers, user]);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.clerkId);
  }, [selectedUser, fetchMessages]);

  return (
    <main className="h-full rounded-lg bg-gradient-to-b from-zinc-800 overflow-hidden">
      <TopBar />
      <div className="grid lg:grid-cols-[300px_1fr] grid-cols-[80px_1fr] h-[calc(100vh-180px)]">
        <UserList />
      </div>
    </main>
  );
}
