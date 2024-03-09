import { type NextRequest } from "next/server";
import { Dirent, readdir, existsSync } from "fs";
import { execSync } from "child_process";
import { getMimeType } from "@/utils/mime";
import {cache, itemValue} from "@/utils/lru";

const infoCache = cache();

export async function GET(request: NextRequest) {
  let path = request.nextUrl.searchParams.get("path") ?? "videos";
  // try to protect against directory traversal
  if (
    path == "/" ||
    path.includes("/..") ||
    path.includes("/../") ||
    path.includes("./") ||
    path.includes("../")
  ) {
    return new Response(`Invalid path`, {
      status: 400,
    });
  }
  // check if path is even available
  if (!existsSync(path)) {
    return new Response(`Path does not exist at ${path}`, {
      status: 400,
    });
  }

  // get all items at path
  let p = await readDir(path);

  return Response.json(p);
}

async function readDir(path: string): Promise<
  {
    name: string;
    path: string;
    type: string;
    mime: string;
    length: number | null;
  }[]
> {
  let items: {
    name: string;
    path: string;
    type: string;
    mime: string;
    length: number | null;
  }[] = [];
  // get all items at path
  return new Promise((resolve, reject) => {
    readdir(path, { withFileTypes: true }, (error, files) => {
      if (error) {
        return Response.json({ error: error });
      } else {
        files.map(async (file) => {
          items.push({
            name: file.name,
            path: file.path,
            type: file.isDirectory() ? "dir" : "file",
            mime: getMimeType(`${file.path}/${file.name}`),
            length: await getMetadata(`${file.path}/${file.name}`),
          });
        });
      }
      resolve(items);
    });
  });
}

async function getMetadata(path: string): Promise<number | null> {
  // check if path is in our lru cache
  try {
    let check = await infoCache.check(path);
    console.log("len check succeeded")
    return check.length;
  } catch {
    // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 file.mp4
    let cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path.replaceAll(
      " ",
      "\\ "
    )}`;
    try {
      let e = execSync(cmd);
      let l = parseFloat(e.toString());
      infoCache.set(path, {length: l});
      return l;
    } catch (err) {
      console.log("Error occurred, run this command to debug: " + cmd);
    }
  }
  return null;
}
