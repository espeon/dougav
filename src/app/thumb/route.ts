import { type NextRequest } from "next/server";
import { execSync } from "child_process";
import fs from "fs";

export async function GET(request: NextRequest) {
  let path =
    request.nextUrl.searchParams.get("path") ?? "videos/dancing_polish_cow.mp4";
  // check if video exists
  if (!fs.existsSync(path)) {
    return new Response(`Video does not exist at ${path}`, {
      status: 400,
    });
  }
  // check if the thumbnail exists
  let outpath_split = path.split(".");
  let outpath = "./cache/" + outpath_split[outpath_split.length - 2] + ".webp";
  if (fs.existsSync(outpath)) {
    return new Response(fs.readFileSync(outpath), {
      headers: {
        "Content-Type": "image/webp",
      },
    });
  }
  let tpath = genThumb(path);
  // load and serve the thumbnail via node fs
  if (fs.existsSync(outpath)) {
    return new Response(fs.readFileSync(outpath), {
      headers: {
        "Content-Type": "image/webp",
      },
    });
  }
}

// generate thumbnail using ffmpeg
function genThumb(path: string): string {
  let outpath_split = path.split(".");
  let outpath = "./cache/" + outpath_split[outpath_split.length - 2] + ".webp";
  // get outpath without the file
  let outpath_path = outpath.split("/");
  outpath_path.pop();
  console.log(outpath_path);
  let pathToCreate = outpath_path.join("/");
  // create the directory if not available
  try {
    fs.mkdirSync(pathToCreate, { recursive: true });
    console.log(`Directory "${pathToCreate}" created successfully.`);
  } catch (err) {
    console.error(`Error creating directory: ${(err as Error).message}`);
  }
  // generate thumbnail
  let cmd = `ffmpeg -ss 00:00:02.000 -i ${path.replaceAll(" ", "\\ ")} -vframes 1 ${outpath.replaceAll(" ", "\\ ")}`;
  try {
    execSync(cmd);
  } catch (err) {
    return "https://i.ytimg.com/vi/9K8ifZ6iDXo/maxresdefault.jpg";
    console.log("Error occurred, run this command to debug: " + cmd);
  }
  return outpath;
}
