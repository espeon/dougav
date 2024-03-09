"use client";
import { useEffect, useState } from "react";

function getSize(bytes: number) {
  console.log(bytes);
  if (bytes > 500000000) {
    return (bytes / 1000000000).toFixed(2) + " GB";
  } else if (bytes > 500000) {
    return (bytes / 1000000).toFixed(2) + " MB";
  } else if (bytes > 1000) {
    return (bytes / 1000).toFixed(2) + " KB";
  } else {
    return bytes + " B";
  }
}

interface VideoInfo {
  name: string;
  mime: string;
  length: number | undefined;
  bytes: number;
}

export default function VideoPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const [ambi, setAmbi] = useState(false);
  let d: {
    name: string;
    mime: string;
    length: number | undefined;
    bytes: number;
  } | null
  // get the slug

  const [data, setData] = useState<VideoInfo|null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${process.env.URL ?? "http://localhost:3000"}/` + "ls/file?path=" + params.slug.join("/"),
      {
        cache: "no-store",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);
  
  return (
    <div className="h-screen flex justify-center items-center">
      <div className="min-h-[50%] w-1/2 max-h-screen">
        <div className="rounded-lg border-slate-900 bg-slate-900 bg-opacity-30 border-2 border-opacity-50 w-full ambilight z-10">
          <video
            className="rounded-lg w-full"
            src={`/api/raw?path=${params.slug.join("/")}`}
            controls
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="flex flex-row mt-2">
          <div className="text-xl mt-2 mx-2 backdrop-invert-0 text-clip">
            {decodeURIComponent(params.slug[params.slug.length - 1])}
          </div>
          <div className="flex-auto"></div>
          <div>
            <a href={`/api/raw?path=${params.slug.join("/")}`} download>
              <button className="dark:bg-blue-800 bg-blue-200 hover:bg-blue-500 text-black dark:text-white py-2 px-4 rounded transition-colors duration-300">
                Download ({data === null?"loading":getSize(data.bytes)})
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
