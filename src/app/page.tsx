import VideoThumb from "@/components/video";
import Image from "next/image";
import Link from "next/link";

async function getData() {
  const res = await fetch("/" + "ls?path=videos", {
    cache: "no-store",
  });
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

// convert seconds to HMS string like 10:30:00
function hms(f:number) {
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
  let d: { name: string; path: string; type: string, length: number|undefined }[] = await getData();
  // filter all item types that arent videos
  d = d.filter((item) => item.type !== "dir");
  if(d.length == 0)
    return (<div className="container flex items-center justify-center px-4 text-center md:px-6 mt-12">
      there is nothing 
    </div>)
  return (
    <section className="w-full py-6">
      <div className="container flex items-center justify-center px-4 text-center md:px-6">
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {d.map((item) => (
            <div key={item.name}>
              {item.type === "dir" ? (
                <p></p>
              ) : (
                <Link href={`/v/${item.path}/${item.name}`} >
                <VideoThumb
                  name={item.name}
                  thumbnail={`/thumb?path=${item.path}/${item.name}`}
                  length={hms(item.length ?? 0)}
                />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
