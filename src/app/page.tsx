import VideoThumb from "@/components/video";
import Image from "next/image";
import Link from "next/link";

async function getData(path: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/` +
      "ls?path=" +
      path,
    {
      cache: "no-store",
    },
  );
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    return [];
  }

  return res.json();
}

// convert seconds to HMS string like 10:30:00
function hms(f: number) {
  let h = Math.floor(f / 3600);
  let m = Math.floor((f % 3600) / 60);
  let s = Math.floor(f % 60);

  let hms = "";
  if (h > 0) {
    hms += h + ":";
    if (m < 10) {
      hms += "0";
    }
  }
  hms += m + ":";
  if (s < 10) {
    hms += "0";
  }
  hms += s;
  return hms;
}

export default async function Home() {
  //"use cache";
  let d: {
    name: string;
    path: string;
    type: string;
    mime: string;
    length: number | undefined;
  }[] = await getData("videos");
  console.log(d);
  // put all item types that arent videos in another array
  var folders = d.filter((item) => item.type === "dir");
  var files = d.filter(
    (item) => item.type === "file" && item.mime.includes("video"),
  );

  if (d.length == 0)
    return (
      <div className="container flex items-center justify-center px-4 text-center md:px-6 mt-12">
        there is nothing
      </div>
    );
  return (
    <section className="py-6 flex items-center justify-center">
      <div className="flex flex-col items-start justify-center px-4 text-center w-full">
        <div className="grid gap-2 auto-cols-max grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 py-8">
          {folders.map((item) => (
            <div key={item.name}>
              <Link href={`/nav/${item.path}/${item.name}`}>
                <div className="w-48 bg-gray-800 rounded p-1 m-2">
                  {item.name}/
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {files.map((item) => (
            <div key={item.name}>
              <Link href={`/v/${item.path}/${item.name}`}>
                <div>
                  <VideoThumb
                    name={item.name}
                    thumbnail={`/thumb?path=${item.path}/${item.name}`}
                    length={hms(item.length ?? 0)}
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
