"use client";

import RealtedPostIcons from "@/components/post-components/realtedPostIcons";
import { Posts } from "@/models/Post";
import { MatchPosts } from "@/models/Match";
import { codeToTeamName } from "@/lib/codeToTeamName";
import Link from "next/link";
import { useEffect, useState } from "react";
import ArticleImage from "../weekly-portion/ArticleImage";

const HeroSection = () => {
  const [post, setPost] = useState<Posts | null>(null);
  const [liveMatch, setLiveMatch] = useState<MatchPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ noticeTitle: "", noticeLink: "" });
  const [isNoticeEmpty, setNoticeEmpty] = useState(false);
  const { noticeTitle, noticeLink } = notice;
  const getTeamLabel = (code: string, name?: string) =>
    codeToTeamName[code] || name || code;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const [featuredRes, noticeRes, liveMatchRes] = await Promise.all([
          fetch("/api/v1/posts/featured"),
          fetch("/api/v1/notice"),
          fetch("/api/v1/live/match?limit=1&page=1"),
        ]);

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setPost(data);
        }

        if (noticeRes.ok) {
          let notice = await noticeRes.json();
          notice = notice.reverse();

          if (notice.length > 0) {
            setNotice(notice[0]);
          } else {
            setNoticeEmpty(true);
          }
        }

        if (liveMatchRes.ok) {
          const liveData = await liveMatchRes.json();
          const live = Array.isArray(liveData?.data)
            ? liveData.data.find((match: MatchPosts) => match.is_live)
            : null;
          setLiveMatch(live || null);
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    fetchPost();
  }, []);

  if (loading || (!post && !liveMatch)) {
    return null;
  }

  return (
    <div>
      <div className="pb-4 lg:mb-2 scroll-smooth focus:scroll-auto md:scroll-auto group/item relative">
        {liveMatch ? (
          <div className="relative flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm animate-flip-down animate-delay-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                  Live Match
                </span>
                <span className="text-sm uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  {liveMatch.match_type}
                </span>
              </div>
              <div className="flex flex-col items-end text-xs text-gray-500 dark:text-gray-400 leading-tight">
                <span>
                  {new Date(liveMatch.match_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>
                  {new Date(liveMatch.match_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center text-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {getTeamLabel(liveMatch.team1.team_code, liveMatch.team1.team_name)}
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {liveMatch.team1.team_score || "0"}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {liveMatch.match_status || "Live"}
                </p>
                {(liveMatch.team1.team_penalty || liveMatch.team2.team_penalty) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Penalties: {liveMatch.team1.team_penalty || "0"} -{" "}
                    {liveMatch.team2.team_penalty || "0"}
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {getTeamLabel(liveMatch.team2.team_code, liveMatch.team2.team_name)}
                </p>
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {liveMatch.team2.team_score || "0"}
                </p>
              </div>
            </div>

            <div className="flex flex-row flex-wrap justify-center gap-3">
              <Link
                href={`/matches/${liveMatch.firebase_match_id}`}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                View match
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300"
              >
                View all matches
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-wrap rounded-2xl animate-flip-down animate-delay-700">
            <div className="w-full lg:w-1/2 lg:pr-12">
              <div className="flex justify-center">
                <Link href={"/posts/" + post!._id.toString()}>
                  <ArticleImage
                    height={900}
                    width={1600}
                    quality={100}
                    src={post!.link}
                    alt="image"
                    className="group/edit rounded-2xl w-auto object-contain aspect-video bg-gray-200 dark:bg-gray-800"
                  />
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 my-auto">
              <div className="flex flex-col">
                <div className="flex flex-row items-center justify-between">
                  <div className="py-4 font-extrabold text-md text-red-600 dark:text-red-400 ml-2 mr-2 tracking-tight animate-fade-left animate-once animate-duration-200 animate-delay-200">
                    Featured
                  </div>
                  <div>
                    <RealtedPostIcons post={post!} />
                  </div>
                </div>
                <Link href={"/posts/" + post!._id.toString()}>
                  <div className="text-4xl tracking-tight font-serif line-clamp-3 ml-2 mr-2 text-ellipsis animate-flip-up animate-once animate-duration-200 animate-delay-200 dark:text-gray-100">
                    {post!.title}
                  </div>
                  <div className="my-2 font-light text-ellipsis line-clamp-2 ml-2 mr-2 animate-fade-up animate-duration-200 animate-delay-200 dark:text-gray-300">
                    {post!.description}
                    {". "}
                    <Link
                      href={"/posts/" + post!._id.toString()}
                      className="underline text-blue-700 dark:text-blue-400"
                    >
                      Read More
                    </Link>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      {!isNoticeEmpty && (
        <div className="py-3 px-3 w-full bg-gradient-to-b from-red-600 via-red-500 to-red-700 flex items-center justify-center rounded-xl">
          <h1 className="bg-white dark:bg-gray-900 text-center text-red-600 dark:text-red-400 font-semibold py-3 px-5 rounded-md">
            Latest Notice
          </h1>
          <p className="text-white dark:text-gray-300 font-sans ml-3 lg:ml-6">
            {noticeTitle}
            {noticeLink && (
              <button className="bg-transparent px-2 py-2 text-sky-100 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg hover:shadow-xl sm:ml-2">
                <Link href={noticeLink} className="font-sans font-bold text ml-2 underline">
                  Click Here
                </Link>
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default HeroSection;
