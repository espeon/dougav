import { type NextRequest } from "next/server";
import { Dirent, readdir } from "fs";
import { execSync } from "child_process";

export async function GET(request: NextRequest) {
  let path = request.nextUrl.searchParams.get("path")??"videos";
  let p = await readDir(path);

  return Response.json(p);
}

async function readDir(
  path: string
): Promise<{ name: string; path: string; type: string, length: number|undefined }[]> {
  let items: { name: string; path: string; type: string, length: number|undefined }[] = [];
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
            length: getMetadata(`${file.path}/${file.name}`),
          });
        });
      }
      resolve(items);
    });
  });
}

function getMetadata(path: string): number | undefined {
    // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 file.mp4
    let cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${path.replaceAll(' ', '\\ ')}`
    try { 
        let e = execSync(cmd)
        return parseFloat(e.toString())
     } catch (err) {
		console.log('Error occurred, run this command to debug: ' + cmd)
	}
    return undefined
}