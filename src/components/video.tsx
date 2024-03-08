import Link from "next/link";

export default function VideoThumb({
  name,
  thumbnail,
  length,
}: {
  name: string;
  thumbnail: string;
  length: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-lg max-w-md shadow-lg dark:shadow-slate-950 dark:hover:shadow-rose-950 hover:shadow-xl duration-500 transition-all">
      <Link
        className="absolute inset-0 flex items-center justify-center p-4 text-3xl text-gray-100 transform translate-y-full transition-all duration-300 bg-black/50"
        href="#"
      >
        <span className="sr-only">Play</span>
        <div className="w-10 h-10" />
      </Link>
      <img
        alt="Video thumbnail"
        className="object-cover w-full aspect-[16/9] group-hover:scale-100/none transition-transform"
        height="225"
        src={thumbnail}
        width="400"
      />
      <p className="absolute bottom-14 right-4 text-xs/none group-hover:text-gray-500 dark:group-hover:text-gray-50 duration-100 transition-colors bg-black/50 group-hover:bg-gray-800/75 p-1 -m-1 rounded-lg">
        {length}
      </p>
      <div className="text-left p-4 group-hover:dark:text-gray-900 group-hover:dark:bg-gray-800 duration-100 transition-colors w-full overflow-ellipsis">
        <h3 className="font-semibold text-base/none group-hover:text-gray-900 dark:group-hover:text-gray-50 duration-100 transition-colors overflow-ellipsis text-wrap">
          {name}
        </h3>
      </div>
    </div>
  );
}
