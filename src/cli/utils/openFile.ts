import { resolve } from "path";
import { spawn, execFile } from "child_process";

export function openFile(filePath: string) {
  const editor = process.env.VISUAL || process.env.EDITOR;
  const safeFilePath = resolve(filePath);

  if (editor) {
    spawn(editor, [safeFilePath], { stdio: "inherit", detached: true });
    return;
  }

  const platform = process.platform;
  if (platform === "win32") {
    execFile("cmd", ["/c", "start", "", `"${safeFilePath}"`], { shell: true });
  } else if (platform === "darwin") {
    execFile("open", [`"${safeFilePath}"`], { shell: true });
  } else {
    execFile("xdg-open", [`"${safeFilePath}"`], { shell: true });
  }
} 