import { resolve } from "path";
import { spawn, execFile } from "child_process";

/**
 * Ouvre un fichier dans l’éditeur configuré (VISUAL ou EDITOR) ou, à défaut,
 * utilise la commande système appropriée pour afficher le fichier.
 */
export function openFile(filePath: string) {
  const editor = process.env.VISUAL || process.env.EDITOR;
  const safeFilePath = resolve(filePath);

  if (editor) {
    spawn(editor, [safeFilePath], { stdio: "inherit", detached: true });
    return;
  }

  const platform = process.platform;
  if (platform === "win32") {
    execFile("cmd", ["/c", "start", "", safeFilePath]);
  } else if (platform === "darwin") {
    execFile("open", [safeFilePath]);
  } else {
    execFile("xdg-open", [safeFilePath]);
  }
} 