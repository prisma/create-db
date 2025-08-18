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

    // Add current line with proper indentation
    formattedLines.push("  ".repeat(indentLevel) + line);

    // Handle opening braces and increase indent
    if (line.includes("{")) {
      indentLevel++;
    }
  }

  // Format field alignment within models
  const finalLines: string[] = [];
  let inModel = false;
  let modelLines: string[] = [];

  for (const line of formattedLines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("model ") && trimmed.includes("{")) {
      inModel = true;
      modelLines = [line];
    } else if (inModel && trimmed === "}") {
      inModel = false;
      // Format the model fields for alignment
      const formatted = formatModelFields(modelLines);
      finalLines.push(...formatted);
      finalLines.push(line);
      modelLines = [];
    } else if (inModel) {
      modelLines.push(line);
    } else {
      finalLines.push(line);
    }
  }

  return finalLines.join("\n");
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
