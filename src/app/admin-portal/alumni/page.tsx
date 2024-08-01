"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { Types } from "mongoose";
import { IBM_Plex_Serif, Nunito_Sans } from "next/font/google";
import { CircularLoader } from "@/components/common/loader/Loaders";
import { Alumni } from "@/models/Alumnus";
import ArticleImage from "@/components/weekly-portion/ArticleImage";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "800"],
});

export default function AlumniPage() {
  const PAGE_LIMIT = 10;
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadmore, setLoadmore] = useState(true);
  const [page, setPage] = useState(1);

  const getData = async () => {
    setLoading(true);
    const response = await fetch(
      `/api/v1/alumnus?limit=${PAGE_LIMIT}&page=${page}`
    );
    const data = await response.json();

    if (data.data.length < PAGE_LIMIT) {
      setLoadmore(false);
    }

    const updatedAlumni = [...alumni, ...data.data];
    setAlumni(updatedAlumni);
    setLoading(false);
  };

  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight &&
      loadmore
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  useEffect(() => {
    getData();
  }, [page]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loadmore]);

  const handleDeleteAlumni = async (_id: string) => {
    const response = await fetch(`/api/v1/alumnus/${_id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      const updatedAlumni = alumni.filter(
        (alum) => alum._id.toString() !== _id.toString()
      );
      setAlumni(updatedAlumni);
    }
  };

  return (
    <div>
      <div className="flex flex-row py-8 justify-between items-center">
        <h1
          className={
            ibmPlexSerif.className + " text-zinc-800 text-5xl font-semibold"
          }
        >
          Alumni Page
        </h1>

        <Link href="/admin-portal/alumni/create-alumni">
          <button className="bg-blue-100 rounded-full text-blue-800 py-2 px-4 flex flex-row items-center gap-2">
            <PlusIcon width={18} height={18} />
            <span>Create Alumni</span>
          </button>
        </Link>
      </div>

      <div className="grid grid-flow-row md:grid-cols-3 gap-2 my-4">
        {alumni.map((alum) => (
          <div
            key={alum._id.toString()}
            className="p-2 bg-white rounded-md gap-2 flex flex-col"
          >
            <div className="">
              <ArticleImage
                src={alum.profile_image}
                alt={alum.name}
                className="w-full aspect-video rounded-md object-cover"
                width={500}
                height={500}
              />
              <h3
                className={ibmPlexSerif.className + " text-lg font-bold mt-4 "}
              >
                {alum.name}
              </h3>
              <p className={nunitoSans.className + " text-gray-700"}>
                {alum.session_start} - {alum.session_end}
              </p>
            </div>

            <hr />
            <div className="flex flex-row justify-between p-2">
              <button>
                <Link
                  href={`/admin-portal/alumni/edit/${alum._id}`}
                  className="flex flex-row items-center gap-2 text-blue-800 hover:bg-slate-100 p-1 rounded-md"
                >
                  <PencilIcon className="h-5 w-5" />
                  Edit
                </Link>
              </button>
              <button
                onClick={() => handleDeleteAlumni(alum._id.toString())}
                className="hover:bg-red-50 p-1 rounded-sm"
              >
                <TrashIcon className="h-5 w-5 text-red-500 " />
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && <CircularLoader />}
    </div>
  );
}
