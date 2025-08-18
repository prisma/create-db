import { NextRequest, NextResponse } from "next/server";

// Simple Prisma schema formatter that works in serverless environments
function formatPrismaSchema(schema: string): string {
  const lines = schema.split("\n");
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      formattedLines.push("");
      continue;
    }

    // Handle closing braces
    if (line === "}") {
      indentLevel = Math.max(0, indentLevel - 1);
      formattedLines.push("  ".repeat(indentLevel) + line);
      continue;
    }

    // Clean up excessive whitespace in field assignments (e.g., "output   =           "../generated/prisma/client"")
    if (line.includes("=")) {
      const parts = line.split("=");
      if (parts.length === 2) {
        const fieldName = parts[0].trim();
        const fieldValue = parts[1].trim();
        line = `${fieldName} = ${fieldValue}`;
      }
    }

    // Add current line with proper indentation
    formattedLines.push("  ".repeat(indentLevel) + line);

    // Handle opening braces and increase indent
    if (line.includes("{")) {
      indentLevel++;
    }
  }

  // Format field alignment within models and other blocks
  const finalLines: string[] = [];
  let inBlock = false;
  let blockLines: string[] = [];
  let blockType = "";

  for (const line of formattedLines) {
    const trimmed = line.trim();

    // Check if we're starting a new block (model, generator, datasource, etc.)
    if (
      (trimmed.startsWith("model ") ||
        trimmed.startsWith("generator ") ||
        trimmed.startsWith("datasource ")) &&
      trimmed.includes("{")
    ) {
      inBlock = true;
      blockType = trimmed.split(" ")[0]; // "model", "generator", or "datasource"
      blockLines = [line];
    } else if (inBlock && trimmed === "}") {
      inBlock = false;
      // Format the block fields for alignment
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

  return finalLines.join("\n");
}

function formatBlockFields(blockLines: string[], blockType: string): string[] {
  if (blockLines.length <= 1) return blockLines;

  const [header, ...fieldLines] = blockLines;

  if (blockType === "model") {
    return formatModelFields(blockLines);
  } else {
    // For generator, datasource, and other blocks - align equals signs
    return formatEqualsAlignment(blockLines);
  }
}

function formatModelFields(modelLines: string[]): string[] {
  if (modelLines.length <= 1) return modelLines;

  const [header, ...fieldLines] = modelLines;
  const fields: Array<{
    line: string;
    name: string;
    type: string;
    attributes: string;
  }> = [];
  const nonFields: string[] = [];

  // Parse field lines
  for (const line of fieldLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
      nonFields.push(line);
      continue;
    }

    // Parse field: fieldName Type @attributes
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

  // Calculate max widths for alignment
  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));
  const maxTypeWidth = Math.max(...fields.map((f) => f.type.length));

  // Format fields with alignment
  const formattedFields = fields.map((field) => {
    const padding = "  "; // Base indentation
    const name = field.name.padEnd(maxNameWidth);
    const type = field.type.padEnd(maxTypeWidth);
    const attributes = field.attributes ? ` ${field.attributes}` : "";
    return `${padding}${name} ${type}${attributes}`;
  });

  return [header, ...formattedFields, ...nonFields];
}

function formatEqualsAlignment(blockLines: string[]): string[] {
  if (blockLines.length <= 1) return blockLines;

  const [header, ...fieldLines] = blockLines;
  const fields: Array<{
    line: string;
    name: string;
    value: string;
  }> = [];
  const nonFields: string[] = [];

  // Parse field lines
  for (const line of fieldLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
      nonFields.push(line);
      continue;
    }

    // Parse field: fieldName = value
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

  // Calculate max width for alignment
  const maxNameWidth = Math.max(...fields.map((f) => f.name.length));

  // Format fields with equals alignment
  const formattedFields = fields.map((field) => {
    const padding = "  "; // Base indentation
    const name = field.name.padEnd(maxNameWidth);
    return `${padding}${name} = ${field.value}`;
  });

  return [header, ...formattedFields, ...nonFields];
}

export async function POST(request: NextRequest) {
  console.log("Format schema API called");

  try {
    const { schema } = (await request.json()) as { schema: string };
    console.log("Received schema length:", schema?.length);

    if (!schema || typeof schema !== "string") {
      console.log("Invalid schema provided");
      return NextResponse.json(
        { error: "Invalid schema provided" },
        { status: 400 }
      );
    }

    // Use simple custom formatter that works in any environment
    const formattedSchema = formatPrismaSchema(schema);
    console.log("Formatted schema length:", formattedSchema.length);

    return NextResponse.json({ formattedSchema });
  } catch (error) {
    console.error("Format schema error:", error);
    return NextResponse.json(
      {
        error: "Failed to format schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
