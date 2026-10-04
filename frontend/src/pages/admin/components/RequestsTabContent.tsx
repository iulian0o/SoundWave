import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useAuthStore } from "../../../stores/useAuthStore";

export default function RequestsTabContent() {
  const { pendingRequests, isReviewLoading, fetchPendingRequests, reviewRequest } =
    useAuthStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    await reviewRequest(id, action);
    setBusyId(null);
  };

  if (isReviewLoading && pendingRequests.length === 0) {
    return <p className="text-sm text-zinc-400 py-6">Loading requests...</p>;
  }

  if (pendingRequests.length === 0) {
    return <p className="text-sm text-zinc-400 py-6">No pending requests.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-zinc-800/50">
          <TableHead>User</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {pendingRequests.map((request) => (
          <TableRow key={request._id} className="hover:bg-zinc-800/50">
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={request.user?.imageUrl} />
                  <AvatarFallback>
                    {request.user?.fullName?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {request.user?.fullName || "Unknown user"}
                </span>
              </div>
            </TableCell>

            <TableCell className="max-w-xs whitespace-normal break-words text-zinc-300">
              {request.reason || <span className="text-zinc-500">No reason given</span>}
            </TableCell>

            <TableCell className="text-zinc-400">
              {new Date(request.createdAt).toLocaleDateString()}
            </TableCell>

            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === request._id}
                  onClick={() => handleReview(request._id, "approve")}
                  className="text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10"
                >
                  <Check className="size-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === request._id}
                  onClick={() => handleReview(request._id, "reject")}
                  className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                >
                  <X className="size-4 mr-1" />
                  Reject
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}