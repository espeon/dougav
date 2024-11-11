import { type NextRequest } from "next/server";
import { readdir, stat } from "fs/promises";
import { Dirent } from "fs";
import { execSync } from "child_process";
import { getMimeType } from "@/utils/mime";
import { cache } from "@/utils/lru";
import { SqliteKV } from "@/utils/denokv";

const infoCache = cache();
const kv = new SqliteKV("./cache/kv.db");

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "videos";

  if (!isValidPath(path)) {
    return new Response(`Invalid filepath`, { status: 400 });
  }

  try {
    const files = await readdir(path, { withFileTypes: true });
    const fileProcessingTasks = files.map((dirent) =>
      processDirent(dirent, path),
    );
    const results = await Promise.all(fileProcessingTasks);
    return Response.json(results.filter((result) => result !== null));
  } catch (error) {
    return new Response("Unable to read files", { status: 400 });
  }
}

async function processDirent(dirent: Dirent, parentPath: string) {
  //"use cache";
  const filePath = `${parentPath}/${dirent.name}`;

  if (dirent.isDirectory()) {
    return await processDir(filePath);
  }

  return await processFile(filePath);
}

async function processDir(dirPath: string) {
  return {
    name: dirPath.split("/").pop() as string,
    path: dirPath.split("/").slice(0, -1).join("/"),
    type: "dir",
    mime: "dir",
    length: null,
    bytes: null,
    timeLastModified: 0,
  };
}

async function processFile(filePath: string) {
  try {
    const [cachedResponse, fileStats] = await Promise.all([
      getCachedResponse(filePath),
      getFileStats(filePath),
    ]);

    if (cachedResponse) return cachedResponse;

    const [mime, metadataLength] = await Promise.all([
      getMimeType(filePath),
      getMetadata(filePath),
    ]);

    const fileInfo = {
      name: filePath.split("/").pop() as string,
      path: filePath.split("/").slice(0, -1).join("/"),
      type: "file",
      mime,
      length: metadataLength,
      bytes: fileStats.size,
      timeLastModified: fileStats.mtimeMs,
    };

    infoCache.set(filePath, fileInfo);
    return fileInfo;
  } catch (error) {
    console.error(`Failed to process file: ${filePath}`, error);
    return null;
  }
}

async function getCachedResponse(path: string) {
  try {
    const [cacheResult, dbResult] = await Promise.all([
      infoCache.check(path),
      kv.getitemValue(path),
    ]);

    if (cacheResult !== undefined) {
      return cacheResult;
    }

    if (dbResult !== null) {
      infoCache.set(path, dbResult);
      return dbResult;
    }
  } catch {
    // Cache miss, continue to get fresh data
  }
  return null;
}

async function getMetadata(path: string): Promise<number | null> {
  //"use cache";
  let cmd;
  try {
    let cachedData = await infoCache.check(path);
    if (cachedData?.length !== null) {
      return cachedData.length;
    }

    cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${escapeShellPath(path)}`;
    const output = execSync(cmd);
    const length = parseFloat(output.toString());

    cachedData.length = length;
    infoCache.set(path, cachedData);
    return length;
  } catch (err) {
    return null;
  }
}

async function getFileStats(path: string) {
  try {
    const stats = await stat(path);
    return stats;
  } catch (err: any) {
    throw new Error(`Failed to get file stats for ${path}: ${err.message}`);
  }
}

function isValidPath(path: string): boolean {
  return !path.includes("..") && !path.startsWith("/");
}

function escapeShellPath(path: string): string {
  return path.replace(/ /g, "\\ ");
}
