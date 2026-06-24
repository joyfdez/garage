"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { followUser, unfollowUser } from "@/lib/actions/follows";
import { toast } from "@/lib/toast";

export function FollowButton({
  followingId,
  initialIsFollowing,
  onFollowChange,
}: {
  followingId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isNowFollowing: boolean) => void;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    onFollowChange?.(!prev);

    const result = prev
      ? await unfollowUser(followingId)
      : await followUser(followingId);

    if (result.error) {
      setIsFollowing(prev);
      onFollowChange?.(prev);
      toast.error("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-card border mb-1 ${
        isFollowing
          ? "bg-white text-ink-muted border-ink/12 hover:border-red-200 hover:text-red-600"
          : "bg-ink text-paper border-transparent hover:bg-ink/85"
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck size={13} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={13} />
          Follow
        </>
      )}
    </button>
  );
}
