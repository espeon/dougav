import { type NextRequest } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const videoPath =
    request.nextUrl.searchParams.get("path") ?? "videos/dancing_polish_cow.mp4";

  // Check if the video exists asynchronously
  if (!(await fileExists(videoPath))) {
    return new Response(`Video does not exist at ${videoPath}`, {
      status: 400,
    });
  }

  const outpath = getThumbnailPath(videoPath);

  // Check if the thumbnail already exists
  if (await fileExists(outpath)) {
    return serveThumbnail(outpath);
  }

  // Generate the thumbnail and then serve it
  try {
    await genThumb(videoPath, outpath);
    return serveThumbnail(outpath);
  } catch (error) {
    return new Response("Failed to generate thumbnail", { status: 500 });
  }
}

// Helper function to serve the thumbnail
async function serveThumbnail(outpath: string) {
  const fileBuffer = await fs.readFile(outpath);
  return new Response(fileBuffer, {
    headers: { "Content-Type": "image/webp" },
  });
}

// Check if a file exists asynchronously
async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Get the output path for the thumbnail
function getThumbnailPath(videoPath: string): string {
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  return path.join("./cache", `${base}.webp`);
}

// Generate thumbnail using ffmpeg in a non-blocking way
function genThumb(videoPath: string, outpath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const outDir = path.dirname(outpath);

    fs.mkdir(outDir, { recursive: true })
      .then(() => {
        const cmd = `ffmpeg -ss 00:00:02.000 -i ${videoPath} -vframes 1 ${outpath}`;
        const ffmpeg = spawn("ffmpeg", [
          "-ss",
          "00:00:02.000",
          "-i",
          videoPath,
          "-vframes",
          "1",
          outpath,
        ]);

        ffmpeg.on("error", (err) => {
          console.error("Error generating thumbnail:", err);
          resolve();
        });

        ffmpeg.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`ffmpeg exited with code ${code}`));
          }
        });
      })
      .catch(reject);
  });
}
