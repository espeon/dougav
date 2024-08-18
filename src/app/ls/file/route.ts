import { type NextRequest } from "next/server";
import { Dirent, readdir, existsSync, stat, statSync } from "fs";
import { execSync } from "child_process";
import { getMimeType } from "@/utils/mime";
import { cache } from "@/utils/lru";
import { SqliteKV } from "@/utils/denokv";

const infoCache = cache();

const kv = new SqliteKV("./cache/kv.db");

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
    return new Response(`Invalid filepath`, {
      status: 400,
    });
  }
  try {
    try {
      let check = await infoCache.check(path);
      if (check === undefined) throw "is null";
      return Response.json(check);
    } catch {
      try {
        let res = await kv.getitemValue(path);
        if (res == null) throw "is null";
        return Response.json(res);
      } catch {
        let stat = statSync(path);
        let len = await getMetadata(path);
        if (stat.isFile()) {
          let mime = getMimeType(path);
          let r = {
            name: path.split("/").pop() as string,
            path: path,
            type: "file",
            mime: mime,
            length: len,
            bytes: stat.size,
            timeLastModified: stat.mtimeMs,
          };
          infoCache.set(path, r);
          return Response.json(r);
        }
      }
    }
  } catch {
    return new Response("Unable to read file", {
      status: 400,
    });
  }
  return new Response("File not specified", {
    status: 400,
  });
}

async function getMetadata(path: string): Promise<number | null> {
  // check if path is in our lru cache
  try {
    let check = await infoCache.check(path);
    return check.length;
  } catch {
    // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 file.mp4
    let cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path.replaceAll(
      " ",
      "\\ ",
    )}`;
    try {
      let e = execSync(cmd);
      let l = parseFloat(e.toString());
      return l;
    } catch (err) {
      console.log("Error occurred, run this command to debug: " + cmd);
    }
  }
  return null;
}
