import { type NextRequest } from "next/server";
import { Dirent, readdir, existsSync } from "fs";
import { execSync } from "child_process";
import { getMimeType } from "@/utils/mime";

export async function GET(request: NextRequest) {
  let path = request.nextUrl.searchParams.get("path")??"videos";
  // try to protect against directory traversal
  if(path == "/" || path.includes('/..') || path.includes('/../') || path.includes("./") || path.includes("../"))
  {
    return new Response(`Invalid path`, {
      status: 400,
    })
  }
  // check if path is even available
  if(!existsSync(path)) {
    return new Response(`Path does not exist at ${path}`, {
      status: 400,
    })
  }

  // get all items at path
  let p = await readDir(path);

  return Response.json(p);
}

async function readDir(
  path: string
): Promise<{ name: string; path: string; type: string, mime: string, length: number|null }[]> {
  let items: { name: string; path: string; type: string, mime: string, length: number|null }[] = [];
  // get all items at path
  return new Promise((resolve, reject) => {
    readdir(path, { withFileTypes: true }, (error, files) => {
      if (error) {
        return Response.json({ error: error });
      } else {
        files.forEach((file) => {
          items.push({
            name: file.name,
            path: file.path,
            type: file.isDirectory() ? "dir" : "file",
            mime: getMimeType(`${file.path}/${file.name}`),
            length: getMetadata(`${file.path}/${file.name}`),
          });
        });
      }
      resolve(items);
    });
  });
}

function getMetadata(path: string): number | null {
    // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 file.mp4
    let cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path.replaceAll(' ', '\\ ')}`
    try { 
        let e = execSync(cmd)
        return parseFloat(e.toString())
     } catch (err) {
		console.log('Error occurred, run this command to debug: ' + cmd)
	}
    return null
}