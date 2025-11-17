"use client";

import { useEffect, useState } from "react";
import { MatchPosts } from "@/models/Match";
import { codeToTeamName } from "@/lib/codeToTeamName";
import Link from "next/link";
import { CircularLoader } from "@/components/common/loader/Loaders";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Teams } from "@/models/Team";

const toRenderableImage = (url?: string) => {
  if (!url) return undefined;
  const driveIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveIdMatch[1]}`;
  }
  return url;
};

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

const TeamCard = ({
  team,
  sport,
}: {
  team?: Teams;
  sport: "football" | "cricket";
}) => {
  if (!team) return null;
  const detail = team[sport];
  if (!detail) return null;
  const players = detail.players || [];

  const captain = players.find((p) =>
    /captain/i.test(p.player_description || "")
  );
  const viceCaptain = players.find(
    (p) =>
      /vice\s*captain/i.test(p.player_description || "") ||
      /vc\b/i.test(p.player_description || "")
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/60 h-full">
      <div className="flex items-center gap-3 mb-3">
        {detail.team_logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toRenderableImage(detail.team_logo)}
            alt={detail.team_name}
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div>
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
            {sport}
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {detail.team_name}
          </p>
        </div>
      </div>
      <div className="grid gap-2 text-sm text-gray-800 dark:text-gray-200">
        {captain && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              Captain
            </span>
            <span>{captain.player_name}</span>
          </div>
        )}
        {viceCaptain && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              Vice Captain
            </span>
            <span>{viceCaptain.player_name}</span>
          </div>
        )}
        {players
          .filter(
            (p) =>
              p !== captain &&
              p !== viceCaptain &&
              (p.player_name || p.player_description)
          )
          .slice(0, 4)
          .map((p) => (
            <div key={p.player_name} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.player_image && (
                <img
                  src={toRenderableImage(p.player_image)}
                  alt={p.player_name}
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{p.player_name}</span>
            {p.player_description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {p.player_description}
              </span>
            )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const MatchDetailPage = ({
  params,
}: {
  params: { matchId: string };
}) => {
  const [match, setMatch] = useState<MatchPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teams, setTeams] = useState<Record<string, Teams>>({});

  const fetchTeams = async (teamCodes: string[]) => {
    const uniqueCodes = Array.from(new Set(teamCodes.filter(Boolean)));
    if (uniqueCodes.length === 0) return;
    const teamResponses = await Promise.all(
      uniqueCodes.map(async (code) => {
        try {
          const tRes = await fetch(`/api/v1/team/${code}`);
          const tData = await tRes.json();
          if (tRes.ok && tData?.data) {
            return [code, tData.data as Teams] as const;
          }
        } catch (err) {
          return null;
        }
        return null;
      })
    );
    const nextTeams: Record<string, Teams> = {};
    teamResponses.forEach((entry) => {
      if (entry) {
        nextTeams[entry[0]] = entry[1];
      }
    });
    if (Object.keys(nextTeams).length > 0) {
      setTeams((prev) => ({ ...prev, ...nextTeams }));
    }
  };

  const fetchMatch = async ({
    silent = false,
    includeTeams = false,
  }: {
    silent?: boolean;
    includeTeams?: boolean;
  } = {}) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/live/match/${params.matchId}`);
      const data = await res.json();
      if (res.ok && data?.data) {
        setMatch(data.data);
        setError(null);
        if (includeTeams) {
          const teamCodes = [
            data.data.team1?.team_code,
            data.data.team2?.team_code,
          ].filter(Boolean) as string[];
          fetchTeams(teamCodes);
        }
      } else {
        setError(data?.msg || "Failed to load match");
      }
    } catch (err) {
      setError("Failed to load match");
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch({ includeTeams: true });
    const interval = setInterval(() => {
      fetchMatch({ silent: true }); // silent refresh every 20 seconds
    }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {match.match_type}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {getTeamLabel(match.team1.team_code, match.team1.team_name)} vs{" "}
            {getTeamLabel(match.team2.team_code, match.team2.team_name)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateTime(match.match_date)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchMatch({ includeTeams: true })}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={isRefreshing}
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <Link
            href="/matches"
            className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Back to matches
          </Link>
        </div>
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

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <TeamCard
          team={teams[match.team1.team_code]}
          sport={match.match_type === "cricket" ? "cricket" : "football"}
        />
        <TeamCard
          team={teams[match.team2.team_code]}
          sport={match.match_type === "cricket" ? "cricket" : "football"}
        />
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
