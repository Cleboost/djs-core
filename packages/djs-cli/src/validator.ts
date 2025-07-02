/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import fs from "fs";
import path from "path";

interface ValidationError {
  file: string;
  message: string;
  type: "duplicate_id" | "button_format" | "missing_method";
}

interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
}

interface InteractionData {
  file: string;
  type: string;
  id?: string;
  hasRunMethod?: boolean;
  hasCustomId?: boolean;
}

/**
 * Validates all interaction files before production build
 */
export async function validateInteractions(
  srcPath: string,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const interactions: InteractionData[] = [];

  // Get all TypeScript files recursively
  const files = getTypeScriptFiles(srcPath);

  // Analyze each file
  for (const file of files) {
    try {
      const interaction = await analyzeInteractionFile(file);
      if (interaction) {
        interactions.push(interaction);
      }
    } catch {
      // Skip files that aren't interaction files or have syntax errors
      continue;
    }
  }

  // Check for duplicate IDs
  checkDuplicateIds(interactions, errors);

  // Check button format
  checkButtonFormat(interactions, errors);

  // Check missing methods
  checkMissingMethods(interactions, errors);

  return {
    success: errors.length === 0,
    errors,
  };
}

function getTypeScriptFiles(dirPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getTypeScriptFiles(fullPath));
    } else if (stat.isFile() && item.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function analyzeInteractionFile(
  filePath: string,
): Promise<InteractionData | null> {
  const content = fs.readFileSync(filePath, "utf-8");

  // Skip files that don't import from djs-core
  if (!content.includes("djs-core")) {
    return null;
  }

  // Detect interaction type based on imports and content
  const interactionType = detectInteractionType(content);
  if (!interactionType) {
    return null;
  }

  const data: InteractionData = {
    file: filePath,
    type: interactionType,
  };

  // Extract ID based on interaction type
  if (interactionType === "Button") {
    data.id = extractButtonCustomId(content);
    data.hasCustomId = data.id !== undefined;
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "Command") {
    data.id = extractCommandName(content);
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "Modal") {
    data.id = extractModalCustomId(content);
    data.hasCustomId = data.id !== undefined;
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "SelectMenu") {
    data.id = extractSelectMenuCustomId(content);
    data.hasCustomId = data.id !== undefined;
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "ContextMenu") {
    data.id = extractContextMenuName(content);
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "SubCommand") {
    data.id = extractSubCommandFullId(content);
    data.hasRunMethod = hasRunMethod(content);
  } else if (interactionType === "SubCommandGroup") {
    data.id = extractCommandName(content);
    data.hasRunMethod = hasRunMethod(content);
  }

  return data;
}

function detectInteractionType(content: string): string | null {
  if (content.includes("new Button()")) return "Button";
  if (content.includes("new Command()")) return "Command";
  if (content.includes("new Modal()")) return "Modal";
  if (content.includes("new SelectMenu()")) return "SelectMenu";
  if (content.includes("new ContextMenu()")) return "ContextMenu";
  if (content.includes("new SubCommand()")) return "SubCommand";
  if (content.includes("new SubCommandGroup()")) return "SubCommandGroup";
  return null;
}

function extractButtonCustomId(content: string): string | undefined {
  const match = content.match(/\.setCustomId\(["']([^"']+)["']\)/);
  return match ? match[1] : undefined;
}

function extractCommandName(content: string): string | undefined {
  const match = content.match(/\.setName\(["']([^"']+)["']\)/);
  return match ? match[1] : undefined;
}

function extractModalCustomId(content: string): string | undefined {
  const match = content.match(/\.setCustomId\(["']([^"']+)["']\)/);
  return match ? match[1] : undefined;
}

function extractSelectMenuCustomId(content: string): string | undefined {
  const match = content.match(/\.setCustomId\(["']([^"']+)["']\)/);
  return match ? match[1] : undefined;
}

function extractContextMenuName(content: string): string | undefined {
  const match = content.match(/\.setName\(["']([^"']+)["']\)/);
  return match ? match[1] : undefined;
}

function extractSubCommandFullId(content: string): string | undefined {
  const nameMatch = content.match(/\.setName\(["']([^"']+)["']\)/);
  const parentMatch = content.match(/\.setParent\(["']([^"']+)["']\)/);

  if (nameMatch && parentMatch) {
    return `${parentMatch[1]}.${nameMatch[1]}`;
  }
  return nameMatch ? nameMatch[1] : undefined;
}

function hasRunMethod(content: string): boolean {
  // Remove comments and strings to avoid false positives
  const cleanContent = content
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, "") // Remove line comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // Remove string contents
    .replace(/'(?:[^'\\]|\\.)*'/g, "''") // Remove string contents
    .replace(/`(?:[^`\\]|\\.)*`/g, "``"); // Remove template string contents

  // Look for .run( pattern
  return /\.run\s*\(/s.test(cleanContent);
}

function checkDuplicateIds(
  interactions: InteractionData[],
  errors: ValidationError[],
) {
  // Group interactions by type first, then by ID
  const typeIdMap = new Map<string, Map<string, InteractionData[]>>();

  // Group interactions by type and ID
  for (const interaction of interactions) {
    if (interaction.id) {
      if (!typeIdMap.has(interaction.type)) {
        typeIdMap.set(interaction.type, new Map());
      }

      const idMap = typeIdMap.get(interaction.type)!;
      if (!idMap.has(interaction.id)) {
        idMap.set(interaction.id, []);
      }
      idMap.get(interaction.id)!.push(interaction);
    }
  }

  // Find duplicates within each interaction type
  for (const [interactionType, idMap] of typeIdMap) {
    for (const [id, interactionList] of idMap) {
      if (interactionList.length > 1) {
        for (const interaction of interactionList) {
          const otherFiles = interactionList
            .filter((i) => i.file !== interaction.file)
            .map((i) => path.relative(process.cwd(), i.file))
            .join(", ");

          errors.push({
            file: path.relative(process.cwd(), interaction.file),
            message: `Duplicate ${interactionType} ID "${id}" found in: ${otherFiles}`,
            type: "duplicate_id",
          });
        }
      }
    }
  }
}

function checkButtonFormat(
  interactions: InteractionData[],
  errors: ValidationError[],
) {
  const buttons = interactions.filter((i) => i.type === "Button");

  for (const button of buttons) {
    if (!button.hasCustomId) {
      errors.push({
        file: path.relative(process.cwd(), button.file),
        message: "Button is missing setCustomId() call",
        type: "button_format",
      });
    }

    if (!button.hasRunMethod) {
      errors.push({
        file: path.relative(process.cwd(), button.file),
        message: "Button is missing run() method",
        type: "button_format",
      });
    }
  }
}

function checkMissingMethods(
  interactions: InteractionData[],
  errors: ValidationError[],
) {
  const typesRequiringRun = [
    "Command",
    "Modal",
    "SelectMenu",
    "ContextMenu",
    "SubCommand",
  ];

  for (const interaction of interactions) {
    if (
      typesRequiringRun.includes(interaction.type) &&
      !interaction.hasRunMethod
    ) {
      errors.push({
        file: path.relative(process.cwd(), interaction.file),
        message: `${interaction.type} is missing run() method`,
        type: "missing_method",
      });
    }
  }
}
