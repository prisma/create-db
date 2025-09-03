export const isInsideBlock = (
  linesBefore: string[],
  currentLine: string,
  blockType: string
): boolean => {
  let openBlocks = 0;
  let inTargetBlock = false;

  for (const line of linesBefore) {
    const trimmed = line.trim();
    if (trimmed.startsWith(blockType)) {
      inTargetBlock = true;
      openBlocks = 1;
    } else if (inTargetBlock) {
      if (trimmed.includes("{")) openBlocks++;
      if (trimmed.includes("}")) openBlocks--;
      if (openBlocks === 0) inTargetBlock = false;
    }
  }

  const currentTrimmed = currentLine.trim();
  if (currentTrimmed.includes("{") && inTargetBlock) openBlocks++;
  if (currentTrimmed.includes("}") && inTargetBlock) openBlocks--;

  return inTargetBlock && openBlocks > 0;
};

export const formatPrismaSchema = (schema: string): string => {
  const lines = schema.split("\n");
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
      formattedLines.push("");
      continue;
    }

    if (line === "}") {
      indentLevel = Math.max(0, indentLevel - 1);
      formattedLines.push("  ".repeat(indentLevel) + line);
      continue;
    }

    if (line.includes("=")) {
      const parts = line.split("=");
      if (parts.length === 2) {
        const fieldName = parts[0].trim();
        const fieldValue = parts[1].trim();
        line = `${fieldName} = ${fieldValue}`;
      }
    }

    formattedLines.push("  ".repeat(indentLevel) + line);

    if (line.includes("{")) {
      indentLevel++;
    }
  }

  const finalLines: string[] = [];
  let inBlock = false;
  let blockLines: string[] = [];
  let blockType = "";

  for (const line of formattedLines) {
    const trimmed = line.trim();

    if (
      (trimmed.startsWith("model ") ||
        trimmed.startsWith("generator ") ||
        trimmed.startsWith("datasource ")) &&
      trimmed.includes("{")
    ) {
      inBlock = true;
      blockType = trimmed.split(" ")[0];
      blockLines = [line];
    } else if (inBlock && trimmed === "}") {
      inBlock = false;
      const formatted = formatBlockFields(blockLines, blockType);
      finalLines.push(...formatted);
      finalLines.push(line);
      blockLines = [];
      blockType = "";
    } else if (inBlock) {
      blockLines.push(line);
    } else {
      finalLines.push(line);
    }
  }

  const result = finalLines.join("\n");
  return cleanWhitespace(result);
};

const formatBlockFields = (
  blockLines: string[],
  blockType: string
): string[] => {
  if (blockLines.length <= 1) return blockLines;

  const [header, ...fieldLines] = blockLines;

  if (blockType === "model") {
    return formatModelFields(blockLines);
  } else {
    return formatEqualsAlignment(blockLines);
  }
};

const formatModelFields = (modelLines: string[]): string[] => {
  if (modelLines.length <= 1) return modelLines;

  const [header, ...fieldLines] = modelLines;
  const fields: Array<{
    line: string;
    name: string;
    type: string;
    attributes: string;
  }> = [];
  const nonFields: string[] = [];

  for (const line of fieldLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
      nonFields.push(line);
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const name = parts[0];
      const type = parts[1];
      const attributes = parts.slice(2).join(" ");
      fields.push({ line, name, type, attributes });
    } else {
      nonFields.push(line);
    }
  }

  if (fields.length === 0) {
    return modelLines;
  }

  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));
  const maxTypeWidth = Math.max(...fields.map((f) => f.type.length));

  const formattedFields = fields.map((field) => {
    const padding = "  ";
    const name = field.name.padEnd(maxNameWidth);
    const type = field.type.padEnd(maxTypeWidth);
    const attributes = field.attributes ? ` ${field.attributes}` : "";
    return `${padding}${name} ${type}${attributes}`;
  });

  return [header, ...formattedFields, ...nonFields];
};

const formatEqualsAlignment = (blockLines: string[]): string[] => {
  if (blockLines.length <= 1) return blockLines;

  const [header, ...fieldLines] = blockLines;
  const fields: Array<{
    line: string;
    name: string;
    value: string;
  }> = [];
  const nonFields: string[] = [];

  for (const line of fieldLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
      nonFields.push(line);
      continue;
    }

    if (trimmed.includes("=")) {
      const parts = trimmed.split("=");
      if (parts.length === 2) {
        const name = parts[0].trim();
        const value = parts[1].trim();
        fields.push({ line, name, value });
      } else {
        nonFields.push(line);
      }
    } else {
      nonFields.push(line);
    }
  }

  if (fields.length === 0) {
    return blockLines;
  }

  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));

  const formattedFields = fields.map((field) => {
    const padding = "  ";
    const name = field.name.padEnd(maxNameWidth);
    return `${padding}${name} = ${field.value}`;
  });

  return [header, ...formattedFields, ...nonFields];
};

const cleanWhitespace = (schema: string): string => {
  const lines = schema.split("\n");
  const cleanedLines: string[] = [];
  let lastWasEmpty = false;
  let inBlock = false;
  let blockStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (!lastWasEmpty) {
        cleanedLines.push("");
        lastWasEmpty = true;
      }
      continue;
    }

    lastWasEmpty = false;

    if (
      (trimmed.startsWith("model ") ||
        trimmed.startsWith("generator ") ||
        trimmed.startsWith("datasource ") ||
        trimmed.startsWith("enum ") ||
        trimmed.startsWith("type ") ||
        trimmed.startsWith("view ")) &&
      trimmed.includes("{")
    ) {
      if (inBlock && blockStartIndex >= 0) {
        const blockLines = cleanedLines.slice(blockStartIndex);
        const cleanedBlock = cleanBlockWhitespace(blockLines);
        cleanedLines.splice(
          blockStartIndex,
          blockLines.length,
          ...cleanedBlock
        );
      }

      inBlock = true;
      blockStartIndex = cleanedLines.length;
      cleanedLines.push(line);
    } else if (trimmed === "}" && inBlock) {
      inBlock = false;
      cleanedLines.push(line);

      if (blockStartIndex >= 0) {
        const blockLines = cleanedLines.slice(blockStartIndex);
        const cleanedBlock = cleanBlockWhitespace(blockLines);
        cleanedLines.splice(
          blockStartIndex,
          blockLines.length,
          ...cleanedBlock
        );
        blockStartIndex = -1;
      }
    } else {
      cleanedLines.push(line);
    }
  }

  if (inBlock && blockStartIndex >= 0) {
    const blockLines = cleanedLines.slice(blockStartIndex);
    const cleanedBlock = cleanBlockWhitespace(blockLines);
    cleanedLines.splice(blockStartIndex, blockLines.length, ...cleanedBlock);
  }

  return cleanedLines.join("\n");
};

const cleanBlockWhitespace = (blockLines: string[]): string[] => {
  if (blockLines.length <= 2) return blockLines;

  const [header, ...contentLines] = blockLines;
  const [footer] = contentLines.slice(-1);
  const fieldLines = contentLines.slice(0, -1);

  const cleanedFields: string[] = [];
  let consecutiveEmptyLines = 0;

  for (const line of fieldLines) {
    const trimmed = line.trim();

    if (!trimmed) {
      consecutiveEmptyLines++;
      if (consecutiveEmptyLines === 1) {
        cleanedFields.push("");
      }
      continue;
    }

    consecutiveEmptyLines = 0;
    cleanedFields.push(line);
  }

  while (
    cleanedFields.length > 0 &&
    cleanedFields[cleanedFields.length - 1] === ""
  ) {
    cleanedFields.pop();
  }

  return [header, ...cleanedFields, footer];
};
