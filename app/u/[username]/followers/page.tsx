import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `Followers of @${username} — Garage` };
}

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: followRows } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", profile.id)
    .order("created_at", { ascending: false });

  const followerIds = (followRows ?? []).map((r) => r.follower_id);

  const { data: profileRows } =
    followerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", followerIds)
      : { data: [] as ProfileRow[] };

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));
  const ordered = followerIds
    .map((id) => profileMap.get(id))
    .filter((p): p is ProfileRow => !!p);

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-6">
        <Link
          href={`/u/${username}`}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors mb-5"
        >
          <ArrowLeft size={13} />
          @{username}
        </Link>
        <h1 className="font-display font-extrabold text-xl text-ink">Followers</h1>
        <p className="text-ink-muted text-sm mt-0.5">
          {ordered.length} {ordered.length === 1 ? "person follows" : "people follow"} @{username}
        </p>
      </div>
      <div className="px-5">
        {ordered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-ink-muted text-sm">No followers yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {ordered.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: ProfileRow }) {
  return (
    <li>
      <Link
        href={`/u/${user.username}`}
        className="flex items-center gap-3 p-3 bg-white border border-ink/8 rounded-card hover:border-racing-green/20 transition-colors group"
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.display_name ?? user.username}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-racing-green/10 flex items-center justify-center shrink-0">
            <span className="font-display font-extrabold text-lg text-racing-green">
              {user.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-ink truncate">
            {user.display_name ?? `@${user.username}`}
          </p>
          <p className="text-xs text-ink-muted">@{user.username}</p>
        </div>
        <span className="text-xs text-hint group-hover:text-racing-green transition-colors">→</span>
      </Link>
    </li>
  );
}
