"use client";
import { useEffect, useState, use } from "react";

function getSize(bytes: number) {
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

export default function VideoPage(props: { params: Promise<{ slug: string[] }> }) {
  const params = use(props.params);
  const [ambi, setAmbi] = useState(false);
  let d: {
    name: string;
    mime: string;
    length: number | undefined;
    bytes: number;
  } | null;
  // get the slug

  const [data, setData] = useState<VideoInfo | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}` +
        "/ls/file?path=" +
        params.slug.join("/"),
      {
        cache: "no-store",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex justify-center items-center">
      <div className="min-h-[50%] w-1/2 max-h-screen mt-12">
        <div className="h-full w-full rounded-lg border-slate-900 border-opacity-50 z-10 ambilight">
          <video
            className="rounded-lg w-full bg-slate-900 bg-opacity-30 border-2 border-opacity-10 border-slate-500"
            src={`/api/raw?path=${params.slug.join("/")}`}
            controls
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <VideoTitle params={params} data={data} />
      </div>
    </div>
  );
}

function VideoTitle({
  params,
  data,
}: {
  params: { slug: string[] };
  data: VideoInfo | null;
}) {
  return (
    <div className="flex flex-row mt-2">
      <div className="text-xl mt-2 mx-2 backdrop-invert-0 text-clip">
        {decodeURIComponent(params.slug[params.slug.length - 1])}
      </div>
      <div className="flex-auto"></div>
      <div>
        <a href={`/api/raw?path=${params.slug.join("/")}`} download>
          <button className="dark:bg-blue-800 bg-blue-200 hover:bg-blue-500 text-black dark:text-white py-2 px-4 rounded transition-all duration-300">
            Download {data === null ? loading : "(" + getSize(data.bytes) + ")"}
          </button>
        </a>
      </div>
    </div>
  );
}

const loading = (
  <div className="inline-block h-6 w-6 -my-1.5 mx-1 animate-[spin_3.5s_ease-in-out_infinite]">
    <div
      className=" h-full w-full animate-[spin_1s_linear_infinite] rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  </div>
);
