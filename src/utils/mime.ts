import { execSync } from "child_process";

/// use `file  -b --mime-type` to get mime type
export function getMimeType(path: string) {
    const mimeType = execSync(`file -b --mime-type ${path.replaceAll(' ', '\\ ')}`).toString().trim();
    return mimeType;
  }