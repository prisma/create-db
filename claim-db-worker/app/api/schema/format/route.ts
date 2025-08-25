import { NextRequest, NextResponse } from "next/server";

interface Field {
  line: string;
  name: string;
  type?: string;
  value?: string;
  attributes?: string;
}

interface BlockField extends Field {
  type: string;
  attributes: string;
}

interface EqualsField extends Field {
  value: string;
}

const BLOCK_TYPES = [
  "model",
  "generator",
  "datasource",
  "enum",
  "type",
  "view",
] as const;

function isBlockStart(line: string): boolean {
  const trimmed = line.trim();
  return BLOCK_TYPES.some(
    (type) => trimmed.startsWith(`${type} `) && trimmed.includes("{")
  );
}

function parseFieldLine(line: string): Field | null {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
    return null;
  }

  if (trimmed.includes("=")) {
    const [name, ...valueParts] = trimmed.split("=");
    if (valueParts.length === 1) {
      return {
        line,
        name: name.trim(),
        value: valueParts[0].trim(),
      };
    }
  } else {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return {
        line,
        name: parts[0],
        type: parts[1],
        attributes: parts.slice(2).join(" "),
      };
    }
  }

  return null;
}

function formatModelFields(modelLines: string[]): string[] {
  if (modelLines.length <= 1) return modelLines;

  const [header, ...fieldLines] = modelLines;
  const fields: BlockField[] = [];
  const nonFields: string[] = [];

  for (const line of fieldLines) {
    const field = parseFieldLine(line);
    if (field && field.type) {
      fields.push(field as BlockField);
    } else {
      nonFields.push(line);
    }
  }

  if (fields.length === 0) return modelLines;

  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));
  const maxTypeWidth = Math.max(...fields.map((f) => f.type!.length));

  const formattedFields = fields.map((field) => {
    const padding = "  ";
    const name = field.name.padEnd(maxNameWidth);
    const type = field.type!.padEnd(maxTypeWidth);
    const attributes = field.attributes ? ` ${field.attributes}` : "";
    return `${padding}${name} ${type}${attributes}`;
  });

  return [header, ...formattedFields, ...nonFields];
}

function formatEqualsAlignment(blockLines: string[]): string[] {
  if (blockLines.length <= 1) return blockLines;

  const [header, ...fieldLines] = blockLines;
  const fields: EqualsField[] = [];
  const nonFields: string[] = [];

  for (const line of fieldLines) {
    const field = parseFieldLine(line);
    if (field && field.value) {
      fields.push(field as EqualsField);
    } else {
      nonFields.push(line);
    }
  }

  if (fields.length === 0) return blockLines;

  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));
  const formattedFields = fields.map((field) => {
    const padding = "  ";
    const name = field.name.padEnd(maxNameWidth);
    return `${padding}${name} = ${field.value}`;
  });

  return [header, ...formattedFields, ...nonFields];
}

function formatBlockFields(blockLines: string[], blockType: string): string[] {
  if (blockLines.length <= 1) return blockLines;

  return blockType === "model"
    ? formatModelFields(blockLines)
    : formatEqualsAlignment(blockLines);
}

function cleanBlockWhitespace(blockLines: string[]): string[] {
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
}

function cleanWhitespace(schema: string): string {
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

    if (isBlockStart(line)) {
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
}

function formatPrismaSchema(schema: string): string {
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
}

export async function POST(request: NextRequest) {
  try {
    const { schema } = (await request.json()) as { schema: string };

    if (!schema || typeof schema !== "string") {
      return NextResponse.json(
        { error: "Invalid schema provided" },
        { status: 400 }
      );
    }

    const formattedSchema = formatPrismaSchema(schema);

    return NextResponse.json({ formattedSchema });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to format schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
