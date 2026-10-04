import { useState } from "react";
import { Loader, ShieldCheck } from "lucide-react";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useAuthStore } from "../stores/useAuthStore";

const MAX_REASON = 300;

export default function AdminRequestDialog() {
  const {
    adminRequest,
    isRequestLoading,
    isSubmitting,
    fetchAdminRequest,
    submitAdminRequest,
  } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchAdminRequest();
    else setReason("");
  };

  const handleSubmit = async () => {
    const ok = await submitAdminRequest(reason.trim());
    if (ok) setReason("");
  };

  const isPending = adminRequest?.status === "pending";
  const isRejected = adminRequest?.status === "rejected";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Request admin access"
        onClick={() => handleOpenChange(true)}
      >
        <ShieldCheck className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Request admin access</DialogTitle>
            <DialogDescription>
              Admins can add and edit songs and albums. Your request will be
              reviewed by the site owner.
            </DialogDescription>
          </DialogHeader>

          {isRequestLoading ? (
            <div className="flex justify-center py-6">
              <Loader className="size-6 text-violet-400 animate-spin" />
            </div>
          ) : isPending ? (
            <p className="text-sm text-zinc-300 py-2">
              Your request is pending. You'll get access as soon as it's
              approved. Reopen this window or refresh the page to check.
            </p>
          ) : (
            <div className="space-y-2">
              {isRejected && (
                <p className="text-sm text-red-400">
                  Your previous request was rejected. You can send a new one.
                </p>
              )}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={MAX_REASON}
                rows={4}
                placeholder="Why do you need admin access? (optional)"
                className="w-full resize-none rounded-md bg-zinc-800 border border-zinc-700 p-3 text-sm
                text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <p className="text-xs text-zinc-500 text-right">
                {reason.length}/{MAX_REASON}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            {!isRequestLoading && !isPending && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send request"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}