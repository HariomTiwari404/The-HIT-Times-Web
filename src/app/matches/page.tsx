"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MatchPosts } from "@/models/Match";
import { codeToTeamName } from "@/lib/codeToTeamName";
import { CircularLoader } from "@/components/common/loader/Loaders";

const formatDate = (dateValue: Date | string) => {
  const d = new Date(dateValue);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`;
};

const getTeamLabel = (code: string, name?: string) =>
  codeToTeamName[code] || name || code;

const ScoreBlock = ({ match }: { match: MatchPosts }) => (
  <div className="grid grid-cols-3 gap-3 items-center text-center">
    <div className="text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {getTeamLabel(match.team1.team_code, match.team1.team_name)}
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
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
        {formatDate(match.match_date)}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {match.match_type}
      </p>
    </div>
    <div className="text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {getTeamLabel(match.team2.team_code, match.team2.team_name)}
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {match.team2.team_score || "0"}
      </p>
      {match.team2.team_penalty && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Penalties: {match.team2.team_penalty}
        </p>
      )}
    </div>
  </div>
);

const MatchesPage = () => {
  const [matches, setMatches] = useState<MatchPosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "football" | "cricket">(
    "all"
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/v1/live/match?limit=200&page=1");
        const data = await res.json();
        if (res.ok && Array.isArray(data?.data)) {
          setMatches(data.data);
        }
      } catch (error) {
        console.error("Failed to load matches", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const liveMatches = matches.filter((m) => m.is_live);
  const pastMatches = matches.filter((m) => !m.is_live);

  const years = useMemo(() => {
    const set = new Set<string>();
    pastMatches.forEach((m) => {
      const y = new Date(m.match_date).getFullYear().toString();
      set.add(y);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [pastMatches]);

  const matchesByType = useMemo(() => {
    const slice = (list: MatchPosts[]) =>
      typeFilter === "all"
        ? list
        : list.filter((m) => m.match_type === typeFilter);
    return {
      live: slice(liveMatches),
      past:
        yearFilter === "all"
          ? slice(pastMatches)
          : slice(
              pastMatches.filter(
                (m) =>
                  new Date(m.match_date).getFullYear().toString() === yearFilter
              )
            ),
    };
  }, [liveMatches, pastMatches, typeFilter, yearFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-left">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Matches
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Live and recent scores for HIT Times matches.
          </p>
        </div>
        <Link
          href="#past-matches"
          className="w-full sm:w-auto text-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          View past matches
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <CircularLoader />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                  Live now
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {matchesByType.live.length > 0
                    ? "Ongoing matches"
                    : "No live matches at the moment"}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "football" | "cricket")
                  }
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4">
              {matchesByType.live.length === 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
                  <p className="text-gray-600 dark:text-gray-300">
                    We will display live scores here when a match is in progress.
                  </p>
                </div>
              )}
              {["football", "cricket"].map((type) => {
                const list = matchesByType.live.filter(
                  (m) => m.match_type === type
                );
                if (list.length === 0) return null;
                return (
                  <div key={type} className="flex flex-col gap-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {type === "football" ? "Football" : "Cricket"}
                    </p>
                    {list.map((match) => (
                      <div
                        key={match.firebase_match_id}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900 shadow-sm"
                      >
                        <ScoreBlock match={match} />
                        <div className="mt-4 flex gap-3 justify-center">
                          <Link
                            href={`/matches/${match.firebase_match_id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            View match
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>

          <section id="past-matches" className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                  Past matches
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Results archived by type and year
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-2 py-1"
                >
                  <option value="all">All</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {["football", "cricket"].map((type) => {
              const list = matchesByType.past.filter(
                (m) => m.match_type === type
              );
              return (
                <div key={type} className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {type === "football" ? "Football" : "Cricket"}
                  </p>
                  {list.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
                      <p className="text-gray-600 dark:text-gray-300">
                        No matches found for this selection.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {list.map((match) => (
                        <div
                          key={match.firebase_match_id}
                          className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900"
                        >
                          <ScoreBlock match={match} />
                          <div className="mt-3 flex justify-between items-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(match.match_date)}
                            </p>
                            <Link
                              href={`/matches/${match.firebase_match_id}`}
                              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View match
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
};

export default MatchesPage;
