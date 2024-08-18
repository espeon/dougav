import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import { getMimeType } from "@/utils/mime";

export default function serveByteRanges(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filePath = req.query.path as string;

  if (!filePath) {
    return res.status(400).json({ error: "path is required" });
  }

  const range = req.headers.range;
  let start: number | undefined;
  let end: number | undefined;

  if (range?.startsWith("bytes=")) {
    const [rangeStart, rangeEnd] = range.replace("bytes=", "").split("-");
    start = rangeStart ? parseInt(rangeStart, 10) : undefined;
    end = rangeEnd ? parseInt(rangeEnd, 10) : undefined;
  }

  const options = { start, end };
  const mime = getMimeType(filePath);
  
  fs.stat(filePath, (err, stat) => {
    if (err) {
      console.error(`File stat error for ${filePath}:`, err);
      return res.status(500).send("Error reading file.");
    }

    const contentLength = stat.size;

    if (req.method === "HEAD") {
      res.writeHead(200, {
        "accept-ranges": "bytes",
        "content-length": contentLength,
        "content-type": mime,
      });
      return res.end();
    }

    const retrievedLength =
      start !== undefined && end !== undefined
        ? end + 1 - start
        : start !== undefined
        ? contentLength - start
        : end !== undefined
        ? end + 1
        : contentLength;

    res.writeHead(start !== undefined || end !== undefined ? 206 : 200, {
      "content-length": retrievedLength,
      "content-type": mime,
      ...(range && {
        "content-range": `bytes ${start || 0}-${end || contentLength - 1}/${contentLength}`,
        "accept-ranges": "bytes",
      }),
    });

    const fileStream = fs.createReadStream(filePath, options);

    fileStream.on("error", (error) => {
      console.error(`Error reading file ${filePath}:`, error);
      res.status(500).send("Error reading file.");
    });

    fileStream.pipe(res);
  });
}
