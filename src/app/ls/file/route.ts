import { type NextRequest } from "next/server";
import { Dirent, readdir, existsSync, stat, statSync } from "fs";
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
    return new Response(`Invalid filepath`, {
      status: 400,
    });
  }
 try {
  let stat = statSync(path);
  let len = await getMetadata(path);
  if (stat.isFile()) {
    let mime = getMimeType(path);
    return Response.json({
      name: path.split("/").pop(),
      mime: mime,
      length: len,
      bytes: stat.size,
    });
  }
} catch {
    return new Response('Unable to read file', {
      status: 400,
    });
}
  return new Response('File not specified', {
    status: 400,
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