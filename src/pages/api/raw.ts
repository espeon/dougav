import type { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";

export default function serveByteRanges(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const filePath = req.query.path;
  if(filePath === undefined) {
    return res.status(400).json({ error: "path is required" });
  }
  // Listing 3.
  const options = {
    start: undefined as undefined | number,
    end: undefined as undefined | number,
  };

  let start: undefined | number = undefined;
  let end: undefined | number = undefined;

  const range = req.headers.range;
  if (range) {
    const bytesPrefix = "bytes=";
    if (range.startsWith(bytesPrefix)) {
      const bytesRange = range.substring(bytesPrefix.length);
      const parts = bytesRange.split("-");
      if (parts.length === 2) {
        const rangeStart = parts[0] && parts[0].trim();
        if (rangeStart && rangeStart.length > 0) {
          options.start = start = parseInt(rangeStart);
        }
        const rangeEnd = parts[1] && parts[1].trim();
        if (rangeEnd && rangeEnd.length > 0) {
          options.end = end = parseInt(rangeEnd);
        }
      }
    }
  }

  res.setHeader("content-type", "video/mp4");

  fs.stat(filePath as string, (err, stat) => {
    if (err) {
      console.error(`File stat error for ${filePath}.`);
      console.error(err);
      res.status(500).send("Error reading file.");
      return;
    }

    let contentLength = stat.size;

    // Listing 4.
    if (req.method === "HEAD") {
      res.statusCode = 200;
      res.setHeader("accept-ranges", "bytes");
      res.setHeader("content-length", contentLength);
      res.setHeader("content-type", "video/mp4");
      res.end();
    } else {
      // Listing 5.
      let retrievedLength;
      if (start !== undefined && end !== undefined) {
        retrievedLength = end + 1 - start;
      } else if (start !== undefined) {
        retrievedLength = contentLength - start;
      } else if (end !== undefined) {
        retrievedLength = end + 1;
      } else {
        retrievedLength = contentLength;
      }

      // Listing 6.
      res.statusCode = start !== undefined || end !== undefined ? 206 : 200;
      res.setHeader("content-length", retrievedLength);

      if (range !== undefined) {
        res.status(206);
        res.setHeader(
          "content-range",
          `bytes ${start || 0}-${end || contentLength - 1}/${contentLength}`
        );
        res.setHeader("accept-ranges", "bytes");
      }

      // Listing 7.
      const fileStream = fs.createReadStream(filePath as string, options);
      fileStream.on("error", (error) => {
        console.log(`Error reading file ${filePath}.`);
        console.log(error);
        res.status(500).send("Error reading file.");
      });

      console.info("Piping", options);
      res.setHeader("content-type", "video/mp4");
      fileStream.pipe(res);
    }
  });
}
