"use client";

import { useEffect, useState } from "react";
import { MatchPosts } from "@/models/Match";
import { codeToTeamName } from "@/lib/codeToTeamName";
import Link from "next/link";
import { CircularLoader } from "@/components/common/loader/Loaders";

const formatDateTime = (d: Date | string) => {
  const date = new Date(d);
  return (
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};
const getTeamLabel = (code: string, name?: string) =>
  codeToTeamName[code] || name || code;

const MatchDetailPage = ({
  params,
}: {
  params: { matchId: string };
}) => {
  const [match, setMatch] = useState<MatchPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/live/match/${params.matchId}`);
        const data = await res.json();
        if (res.ok && data?.data) {
          setMatch(data.data);
        } else {
          setError(data?.msg || "Failed to load match");
        }
      } catch (err) {
        setError("Failed to load match");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.matchId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CircularLoader />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-red-600 dark:text-red-400">{error || "Match not found."}</p>
        <Link href="/matches" className="text-blue-600 dark:text-blue-400 hover:underline">
          Back to matches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {match.match_type}
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {getTeamLabel(match.team1.team_code, match.team1.team_name)} vs{" "}
            {getTeamLabel(match.team2.team_code, match.team2.team_name)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(match.match_date)}
          </p>
        </div>
        <Link
          href="/matches"
          className="rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Back to matches
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="grid grid-cols-3 gap-4 items-center text-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {getTeamLabel(match.team1.team_code, match.team1.team_name)}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {match.team1.team_score || "0"}
            </p>
            {match.team1.team_penalty && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Penalties: {match.team1.team_penalty}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {match.match_status || (match.is_live ? "Live" : "Completed")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {match.is_live ? "Live" : "Final"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {getTeamLabel(match.team2.team_code, match.team2.team_name)}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {match.team2.team_score || "0"}
            </p>
            {match.team2.team_penalty && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Penalties: {match.team2.team_penalty}
              </p>
            )}
          </div>
        </div>
      </div>

      {match.timeline && match.timeline.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Timeline
          </h2>
          <div className="grid gap-3">
            {match.timeline
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.timeline_date).getTime() -
                  new Date(a.timeline_date).getTime()
              )
              .map((t) => (
                <div
                  key={t.firebase_timeline_id}
                  className="rounded-md border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800 overflow-hidden break-words"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatDateTime(t.timeline_date)}
                  </p>
                  <div
                    className="text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert break-words"
                    dangerouslySetInnerHTML={{ __html: t.msgHtml }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailPage;
