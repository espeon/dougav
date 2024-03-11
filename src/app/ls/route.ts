import { type NextRequest } from "next/server";
import { Dirent, readdir, existsSync, statSync } from "fs";
import { opendir } from "fs/promises";
import { execSync } from "child_process";
import { getMimeType } from "@/utils/mime";
import { cache, itemValue } from "@/utils/lru";

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

async function readDir(path: string): Promise<itemValue[]> {
  let items: itemValue[] = [];
  let dir = await opendir(path);
  return new Promise(async (resolve, reject) => {
    for await (const file of dir) {
      try {
        let check = await infoCache.check(`${file.path}/${file.name}`);
        console.log(check);
        if (check === undefined) throw "is null";
        console.log(`${file.path}/${file.name} fetched from cache`);
        items.push(check);
      } catch {
        // get item size
        let stat = statSync(`${file.path}/${file.name}`);
        let f: itemValue = {
          name: file.name,
          path: file.path,
          type: file.isDirectory() ? "dir" : "file",
          mime: getMimeType(`${file.path}/${file.name}`),
          length: await getMetadata(`${file.path}/${file.name}`),
          bytes: stat.isFile() ? stat.size : null,
        };
        console.log("putting " + `${file.path}/${file.name} in cache`);
        infoCache.set(`${file.path}/${file.name}`, f);
        items.push(f);
      }
    }
    resolve(items);
  });
}

async function getMetadata(path: string): Promise<number | null> {
  // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 file.mp4
  let cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path.replaceAll(
    " ",
    "\\ "
  )}`;
  try {
    let e = execSync(cmd);
    let l = parseFloat(e.toString());
    return l;
  } catch (err) {
    console.log("Error occurred, run this command to debug: " + cmd);
    return null;
  }
}
