"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { customToast } from "@/lib/custom-toast";
import Modal from "./Modal";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-code">
      <div className="text-center">
        <svg
          width="48"
          height="60"
          viewBox="0 0 58 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-4 animate-pulse"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z"
            fill="white"
          />
        </svg>
        <p className="text-sm text-muted">Loading editor...</p>
      </div>
    </div>
  ),
});

interface PrismaSchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
  connectionString?: string;
}

const PrismaSchemaEditor = ({
  value,
  onChange,
  connectionString,
}: PrismaSchemaEditorProps) => {
  const editorRef = useRef<any>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [lastPush, setLastPush] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [completionDisposable, setCompletionDisposable] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<string>("");
  const [isPulling, setIsPulling] = useState(false);
  const [hasPulledForConnection, setHasPulledForConnection] =
    useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (
      connectionString &&
      isMounted &&
      hasPulledForConnection !== connectionString
    ) {
      handlePullFromDb();
      setHasPulledForConnection(connectionString);
    }
  }, [connectionString, isMounted, hasPulledForConnection]);

  useEffect(() => {
    return () => {
      if (
        completionDisposable &&
        typeof completionDisposable.dispose === "function"
      ) {
        completionDisposable.dispose();
      }
    };
  }, [completionDisposable]);

  const isInsideBlock = (
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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    monaco.languages.register({ id: "prisma" });

    monaco.languages.setMonarchTokensProvider("prisma", {
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
          [
            /\b(generator|datasource|model|enum|type|view)\b/,
            "keyword.control",
          ],
          [
            /\b(provider|url|relationMode|binaryTargets|previewFeatures|output|directUrl|shadowDatabaseUrl)\b/,
            "keyword.other",
          ],
          [
            /\b(String|Boolean|Int|BigInt|Float|Decimal|DateTime|Json|Bytes|Unsupported)\b/,
            "type.primitive",
          ],
          [/@@?[a-zA-Z_]\w*/, "annotation"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/"/, "string", "@string_double"],
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/'/, "string", "@string_single"],
          [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
          [/\d+/, "number"],
          [/env\s*\(\s*"[^"]*"\s*\)/, "variable.env"],
          [/\b[A-Z][a-zA-Z0-9_]*\b/, "type.model"],
          [/\b[a-z][a-zA-Z0-9_]*\b/, "identifier"],
          [/[?]/, "operator.optional"],
          [/\[\s*\]/, "operator.array"],
          [/[{}()\[\]]/, "delimiter.bracket"],
          [/[,;]/, "delimiter"],
          [/[:=]/, "operator"],
        ],
        comment: [
          [/[^\/*]+/, "comment"],
          [/\*\//, "comment", "@pop"],
          [/[\/*]/, "comment"],
        ],
        string_double: [
          [/[^\\"]+/, "string"],
          [/\\./, "string.escape"],
          [/"/, "string", "@pop"],
        ],
        string_single: [
          [/[^\\']+/, "string"],
          [/\\./, "string.escape"],
          [/'/, "string", "@pop"],
        ],
      },
    });

    monaco.editor.defineTheme("prisma-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword.control", foreground: "7f9cf5", fontStyle: "bold" },
        { token: "keyword.other", foreground: "5a67d8" },
        { token: "type.primitive", foreground: "71e8df", fontStyle: "bold" },
        { token: "type.model", foreground: "16a394" },
        { token: "annotation", foreground: "667eea" },
        { token: "string", foreground: "92efe6" },
        { token: "string.escape", foreground: "04c8bb" },
        { token: "comment", foreground: "a0aec0", fontStyle: "italic" },
        { token: "number", foreground: "667eea" },
        { token: "number.float", foreground: "667eea" },
        { token: "variable.env", foreground: "16a394" },
        { token: "operator.optional", foreground: "e2e8f0" },
        { token: "operator.array", foreground: "e2e8f0" },
        { token: "identifier", foreground: "e2e8f0" },
        { token: "delimiter.bracket", foreground: "e2e8f0" },
        { token: "delimiter", foreground: "cbd5e0" },
        { token: "operator", foreground: "e2e8f0" },
      ],
      colors: {
        "editor.background": "#181b21",
        "editor.foreground": "#e2e8f0",
        "editorLineNumber.foreground": "#718096",
        "editorLineNumber.activeForeground": "#e2e8f0",
        "editor.selectionBackground": "#2d3748",
        "editor.selectionHighlightBackground": "#4a5568",
        "editor.wordHighlightBackground": "#4a5568",
        "editor.wordHighlightStrongBackground": "#2d3748",
        "editorCursor.foreground": "#e2e8f0",
        "editorBracketMatch.background": "#2d374850",
        "editorBracketMatch.border": "#5a67d8",
        "editor.lineHighlightBackground": "#2d3748",
        "editorGutter.background": "#181b22",
        "editorWhitespace.foreground": "#4a5568",
        "editorIndentGuide.background": "#4a5568",
        "editorIndentGuide.activeBackground": "#718096",
        "editorRuler.foreground": "#4a5568",
      },
    });

    monaco.editor.setTheme("prisma-dark");

    setCompletionDisposable(
      monaco.languages.registerCompletionItemProvider("prisma", {
        triggerCharacters: ["@", "=", '"', " ", "\n", "{"],
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const line = model.getLineContent(position.lineNumber);
          const beforeCursor = line.substring(0, position.column - 1);
          const allText = model.getValue();
          const linesBefore = allText
            .split("\n")
            .slice(0, position.lineNumber - 1);

          const isInGenerator = isInsideBlock(linesBefore, line, "generator");
          const isInDatasource = isInsideBlock(linesBefore, line, "datasource");
          const isInModel = isInsideBlock(linesBefore, line, "model");
          const isInEnum = isInsideBlock(linesBefore, line, "enum");
          const isAfterAt = beforeCursor.trim().endsWith("@");
          const isFieldDeclaration =
            isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(beforeCursor);
          const isFieldType =
            isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s+$/.test(beforeCursor);
          const isPropertyValue = /=\s*$/.test(beforeCursor);
          const isAfterSpace = beforeCursor.endsWith(" ");
          const isNewLine = beforeCursor.trim() === "";
          const isInsideParens =
            beforeCursor.includes("(") && !beforeCursor.includes(")");

          let suggestions: any[] = [];

          if (isInDatasource && !isPropertyValue) {
            const datasourceProps = [
              { name: "provider", snippet: 'provider = "${1:postgresql}"' },
              { name: "url", snippet: 'url = env("${1:DATABASE_URL}")' },
              {
                name: "directUrl",
                snippet: 'directUrl = env("${1:DIRECT_URL}")',
              },
              {
                name: "shadowDatabaseUrl",
                snippet: 'shadowDatabaseUrl = env("${1:SHADOW_DATABASE_URL}")',
              },
            ];

            suggestions.push(
              ...datasourceProps.map((prop) => ({
                label: prop.name,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop.snippet,
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
              }))
            );
          }

          if (
            isInDatasource &&
            isPropertyValue &&
            beforeCursor.includes("provider")
          ) {
            const providers = [
              "postgresql",
              "mysql",
              "sqlite",
              "sqlserver",
              "mongodb",
              "cockroachdb",
            ];
            suggestions.push(
              ...providers.map((provider) => ({
                label: `"${provider}"`,
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: `"${provider}"`,
                range,
              }))
            );
          }

          if (isInModel && isNewLine && !isFieldType && !isAfterAt) {
            suggestions.push(
              {
                label: "id",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText:
                  "id    ${1|Int,String|} @id @default(${2|autoincrement(),cuid(),uuid()|})",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Primary key field",
                range,
                sortText: "1",
              },
              {
                label: "field",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText:
                  "${1:fieldName} ${2|String,Int,Boolean,DateTime,Float,Decimal,Json,Bytes|} ${3:@unique}",
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: "Basic field",
                range,
                sortText: "2",
              },
              {
                label: "createdAt",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "createdAt DateTime @default(now())",
                documentation: "Creation timestamp field",
                range,
                sortText: "3",
              },
              {
                label: "updatedAt",
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: "updatedAt DateTime @updatedAt",
                documentation: "Update timestamp field",
                range,
                sortText: "4",
              }
            );
          }

          if (isFieldType) {
            const fieldTypes = [
              { name: "String", desc: "Variable length text" },
              { name: "Boolean", desc: "True or false value" },
              { name: "Int", desc: "32-bit signed integer" },
              { name: "BigInt", desc: "64-bit signed integer" },
              { name: "Float", desc: "Floating point number" },
              { name: "Decimal", desc: "High precision decimal" },
              { name: "DateTime", desc: "Timestamp" },
              { name: "Json", desc: "JSON object" },
              { name: "Bytes", desc: "Binary data" },
              { name: "String?", desc: "Optional string" },
              { name: "Int?", desc: "Optional integer" },
              { name: "Boolean?", desc: "Optional boolean" },
              { name: "DateTime?", desc: "Optional timestamp" },
              { name: "String[]", desc: "Array of strings" },
              { name: "Int[]", desc: "Array of integers" },
            ];

            suggestions.push(
              ...fieldTypes.map((type) => ({
                label: type.name,
                kind: monaco.languages.CompletionItemKind.TypeParameter,
                insertText: type.name,
                documentation: type.desc,
                range,
                sortText: type.name.includes("?")
                  ? "2"
                  : type.name.includes("[]")
                    ? "3"
                    : "1",
              }))
            );
          }

          if (isAfterAt) {
            const attributes = [
              { name: "id", snippet: "id", desc: "Defines the primary key" },
              {
                name: "unique",
                snippet: "unique",
                desc: "Defines a unique constraint",
              },
              {
                name: "default",
                snippet: "default(${1:value})",
                desc: "Sets a default value",
              },
              {
                name: "relation",
                snippet:
                  "relation(fields: [${1:fieldName}], references: [${2:id}])",
                desc: "Defines a relation",
              },
              {
                name: "updatedAt",
                snippet: "updatedAt",
                desc: "Auto-updates timestamp",
              },
              {
                name: "map",
                snippet: 'map("${1:column_name}")',
                desc: "Maps to database column",
              },
              {
                name: "db",
                snippet: "db.${1:VarChar(255)}",
                desc: "Database-specific attribute",
              },
              {
                name: "ignore",
                snippet: "ignore",
                desc: "Excludes field from client",
              },
            ];

            suggestions.push(
              ...attributes.map((attr) => ({
                label: `@${attr.name}`,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: `@${attr.snippet}`,
                insertTextRules: attr.snippet.includes("$")
                  ? monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet
                  : undefined,
                documentation: attr.desc,
                range,
                sortText: "1",
              }))
            );
          }

          if (isInsideParens && beforeCursor.includes("@default(")) {
            const functions = [
              { name: "autoincrement()", desc: "Auto-incrementing integer" },
              { name: "cuid()", desc: "Collision-resistant unique identifier" },
              { name: "uuid()", desc: "UUID v4" },
              { name: "now()", desc: "Current timestamp" },
              { name: 'env("DATABASE_URL")', desc: "Environment variable" },
              {
                name: 'dbgenerated("expression")',
                desc: "Database-generated value",
              },
            ];

            suggestions.push(
              ...functions.map((func) => ({
                label: func.name,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: func.name,
                documentation: func.desc,
                range,
                sortText: "1",
              }))
            );
          }

          if (isInGenerator && !isPropertyValue) {
            const generatorProps = [
              {
                name: "provider",
                snippet: 'provider = "${1:prisma-client-js}"',
              },
              {
                name: "output",
                snippet: 'output = "${1:../generated/client}"',
              },
              {
                name: "previewFeatures",
                snippet: 'previewFeatures = [${1:"relationJoins"}]',
              },
              {
                name: "binaryTargets",
                snippet: 'binaryTargets = [${1:"native"}]',
              },
            ];

            suggestions.push(
              ...generatorProps.map((prop) => ({
                label: prop.name,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop.snippet,
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
              }))
            );
          }

          if (isInGenerator && isPropertyValue) {
            if (beforeCursor.includes("provider")) {
              suggestions.push(
                {
                  label: '"prisma-client"',
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: '"prisma-client"',
                  range,
                },
                {
                  label: '"prisma-client-js"',
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: '"prisma-client-js"',
                  range,
                }
              );
            } else if (beforeCursor.includes("previewFeatures")) {
              const features = [
                "relationJoins",
                "fullTextSearch",
                "postgresqlExtensions",
                "views",
                "multiSchema",
              ];
              suggestions.push(
                ...features.map((feature) => ({
                  label: `"${feature}"`,
                  kind: monaco.languages.CompletionItemKind.Value,
                  insertText: `"${feature}"`,
                  range,
                }))
              );
            }
          }

          if (!isInGenerator && !isInDatasource && !isInModel && !isInEnum) {
            if (isNewLine || /^\s*(gen|mod|dat|enu|typ|vie)/.test(line)) {
              suggestions.push(
                {
                  label: "generator",
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: [
                    "generator ${1:client} {",
                    '  provider = "prisma-client"',
                    '  output   = "../generated/prisma/client"',
                    "}",
                  ].join("\n"),
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  documentation: "Define a code generator",
                  range,
                  sortText: "1",
                },
                {
                  label: "model",
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: [
                    "model ${1:User} {",
                    "  id    Int     @id @default(autoincrement())",
                    "  email String  @unique",
                    "  name  String?",
                    "}",
                  ].join("\n"),
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  documentation: "Define a data model",
                  range,
                  sortText: "2",
                },
                {
                  label: "datasource",
                  kind: monaco.languages.CompletionItemKind.Module,
                  insertText: [
                    "datasource ${1:db} {",
                    '  provider = "${2:postgresql}"',
                    '  url      = env("${3:DATABASE_URL}")',
                    "}",
                  ].join("\n"),
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  documentation: "Define a datasource",
                  range,
                  sortText: "3",
                },
                {
                  label: "enum",
                  kind: monaco.languages.CompletionItemKind.Enum,
                  insertText: [
                    "enum ${1:Role} {",
                    "  ${2:USER}",
                    "  ${3:ADMIN}",
                    "}",
                  ].join("\n"),
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  documentation: "Define an enumeration",
                  range,
                  sortText: "4",
                }
              );
            }
          }

          if (isInEnum && isNewLine) {
            suggestions.push({
              label: "enum value",
              kind: monaco.languages.CompletionItemKind.EnumMember,
              insertText: "${1:VALUE}",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            });
          }

          return { suggestions };
        },
      })
    );

    const hoverProvider = monaco.languages.registerHoverProvider("prisma", {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const documentation: { [key: string]: string } = {
          model:
            "**Model** - Represents an entity in your application domain and maps to a table (relational databases) or collection (MongoDB)",
          generator:
            "**Generator** - Determines which assets are created from your Prisma schema",
          datasource:
            "**Datasource** - Tells Prisma what database you use and how to connect to it",
          enum: "**Enum** - Defines a list of possible values for a field",
          "@id": "**@id** - Defines a single-field ID on the model",
          "@unique": "**@unique** - Defines a unique constraint for this field",
          "@default": "**@default** - Defines a default value for this field",
          "@relation":
            "**@relation** - Defines meta information about the relation",
          "@updatedAt":
            "**@updatedAt** - Automatically stores the time when a record was last updated",
          "@map":
            "**@map** - Maps a field name or enum value from the Prisma schema to a column or document field name in the database",
          String: "**String** - Variable length text",
          Boolean: "**Boolean** - True or false value",
          Int: "**Int** - 32-bit signed integer",
          BigInt: "**BigInt** - 64-bit signed integer",
          Float: "**Float** - Floating point number",
          Decimal: "**Decimal** - High precision floating point number",
          DateTime: "**DateTime** - Timestamp",
          Json: "**Json** - JSON object",
          Bytes: "**Bytes** - Raw bytes (binary data)",
          autoincrement:
            "**autoincrement()** - Creates a sequence of integers in the underlying database",
          cuid: "**cuid()** - Generates a globally unique identifier based on the cuid spec",
          uuid: "**uuid()** - Generates a globally unique identifier based on the UUID spec",
          now: "**now()** - Sets a timestamp of the time when a record is created",
        };

        if (documentation[word.word]) {
          return {
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [{ value: documentation[word.word] }],
          };
        }
      },
    });

    monaco.languages.registerDocumentFormattingEditProvider("prisma", {
      provideDocumentFormattingEdits: (model: any) => {
        const value = model.getValue();

        const formatPrismaSchema = (schema: string): string => {
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
            if (
              !trimmed ||
              trimmed.startsWith("//") ||
              trimmed.startsWith("@@")
            ) {
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
            if (
              !trimmed ||
              trimmed.startsWith("//") ||
              trimmed.startsWith("@@")
            ) {
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
            cleanedLines.splice(
              blockStartIndex,
              blockLines.length,
              ...cleanedBlock
            );
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

        const formatted = formatPrismaSchema(value);

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });

    editor.addAction({
      id: "prisma.format",
      label: "Format Prisma Schema",
      keybindings: [
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      ],
      run: () => {
        handleFormat();
      },
    });
  };

  const handleFormat = async () => {
    if (!editorRef.current) return;

    setIsFormatting(true);

    try {
      const currentValue = editorRef.current.getValue();

      const response = await fetch("/api/schema/format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schema: currentValue }),
      });

      if (response.ok) {
        const { formattedSchema } = (await response.json()) as {
          formattedSchema: string;
        };
        editorRef.current.setValue(formattedSchema);
        onChange(formattedSchema);
      } else {
        await editorRef.current.trigger(
          "format",
          "editor.action.formatDocument",
          {}
        );
      }
    } catch (error) {
      console.error("Error formatting:", error);

      try {
        await editorRef.current.trigger(
          "format",
          "editor.action.formatDocument",
          {}
        );
      } catch (fallbackError) {
        console.error("Fallback formatting failed:", fallbackError);
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handlePushToDb = async () => {
    if (!connectionString) {
      customToast("error", "No connection string available");
      return;
    }

    setIsPushing(true);

    try {
      const currentValue = editorRef.current?.getValue() || value;

      const response = await fetch("/api/schema/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Connection-String": connectionString,
        },
        body: JSON.stringify({
          schema: currentValue,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        details?: string;
        requiresForceReset?: boolean;
      };

      if (response.ok) {
        if (result.requiresForceReset) {
          setPendingSchema(currentValue);
          setShowForceResetModal(true);
          return;
        }

        setLastPush(new Date());
        customToast("success", "Schema pushed to database successfully");
      } else {
        const errorMessage = result.details || "Failed to push schema";
        setErrorDetails(errorMessage);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error pushing to database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromDb = async () => {
    if (!connectionString) return;

    setIsPulling(true);

    try {
      const response = await fetch("/api/schema/pull", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Connection-String": connectionString,
        },
      });

      const result = (await response.json()) as {
        schema?: string;
        details?: string;
        isEmpty?: boolean;
        message?: string;
      };

      if (response.ok && result.schema) {
        if (!result.isEmpty) {
          customToast("success", "Schema pulled from database successfully");
        }
        onChange(result.schema);
        if (editorRef.current) {
          editorRef.current.setValue(result.schema);
        }
      } else {
        const errorMessage = result.details || "Failed to pull schema";
        setErrorDetails(errorMessage);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error pulling from database:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsPulling(false);
    }
  };

  const handleForceReset = async () => {
    if (!connectionString || !pendingSchema) return;

    setIsPushing(true);

    try {
      const response = await fetch("/api/schema/push-force", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Connection-String": connectionString,
        },
        body: JSON.stringify({
          schema: pendingSchema,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        details?: string;
      };

      if (response.ok) {
        setLastPush(new Date());
        customToast("success", "Schema pushed to database successfully");
        setShowForceResetModal(false);
        setPendingSchema("");
      } else {
        const errorMessage = result.details || "Failed to push schema";
        setErrorDetails(errorMessage);
        setShowErrorModal(true);
        setShowForceResetModal(false);
      }
    } catch (error) {
      console.error("Error pushing to database with force reset:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
      setShowForceResetModal(false);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-code">
        <div className="text-center">
          <svg
            width="48"
            height="60"
            viewBox="0 0 58 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4 animate-pulse"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z"
              fill="white"
            />
          </svg>
          <p className="text-sm text-muted">Initializing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-code rounded-lg p-2 gap-2">
      <div className="w-16 rounded-lg bg-step flex flex-col justify-between items-center py-2">
        <div className="flex flex-col items-center space-y-1">
          <button
            onClick={handlePullFromDb}
            disabled={isPulling || isPushing || !connectionString}
            className="aspect-square p-2 flex flex-col items-center justify-center rounded-md text-muted hover:text-white hover:bg-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !connectionString
                ? "No connection string available"
                : "Pull schema from database (prisma db pull)"
            }
          >
            {isPulling ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                >
                  <path d="M19 16v6m0 0l3-3m-3 3l-3-3M4 6v6s0 3 7 3s7-3 7-3V6" />
                  <path d="M11 3c7 0 7 3 7 3s0 3-7 3s-7-3-7-3s0-3 7-3m0 18c-7 0-7-3-7-3v-6" />
                </g>
              </svg>
            )}
            <span className="text-xs font-bold mt-1">Pull</span>
          </button>

          <button
            onClick={handlePushToDb}
            disabled={isPushing || isPulling || !connectionString}
            className="aspect-square p-2  flex flex-col items-center justify-center rounded-md text-muted hover:text-white hover:bg-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !connectionString
                ? "No connection string available"
                : "Push schema to database (prisma db push)"
            }
          >
            {isPushing ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                >
                  <path d="M4 6v6s0 3 7 3s7-3 7-3V6" />
                  <path d="M11 3c7 0 7 3 7 3s0 3-7 3s-7-3-7-3s0-3 7-3m0 18c-7 0-7-3-7-3v-6m15 10v-6m0 0l3 3m-3-3l-3 3" />
                </g>
              </svg>
            )}
            <span className="text-xs font-bold mt-1">Push</span>
          </button>

          <button
            onClick={handleFormat}
            disabled={isFormatting || isPulling || isPushing}
            className={`aspect-square p-2 flex flex-col items-center justify-center text-muted hover:text-white hover:bg-button rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormatting ? "bg-button text-white" : ""
            }`}
            title={
              isFormatting
                ? "Formatting schema..."
                : "Format schema (Shift+Alt+F)"
            }
          >
            {isFormatting ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="m14.363 5.652l1.48-1.48a2 2 0 0 1 2.829 0l1.414 1.414a2 2 0 0 1 0 2.828l-1.48 1.48m-4.243-4.242l-9.616 9.615a2 2 0 0 0-.578 1.238l-.242 2.74a1 1 0 0 0 1.084 1.085l2.74-.242a2 2 0 0 0 1.24-.578l9.615-9.616m-4.243-4.242l4.243 4.242"
                />
              </svg>
            )}
            <span className="text-xs font-bold mt-1">Format</span>
          </button>
        </div>
        {lastPush && (
          <div className="mb-3 flex flex-col items-center">
            <div className="text-xs bg-accent/20 text-accent px-1 py-0.5 rounded border border-accent/30 text-center w-12 flex items-center justify-center">
              Last Push
            </div>
            <span className="text-xs text-muted mt-1 text-center">
              {lastPush.toLocaleTimeString().split(" ")[0]}
            </span>
          </div>
        )}
      </div>

      {isPulling ? (
        <div className="flex-1 p-1 bg-[#181b21] flex flex-col rounded-lg">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="h-8 w-8 animate-spin mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15M4 20v-5h.581m0 0a8.003 8.003 0 0015.357-2M4.581 15H9"
                />
              </svg>
              <p className="text-white font-medium">
                Pulling schema from database...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-1 bg-[#181b21] flex flex-col rounded-lg">
          <div className="flex-1">
            <Editor
              height="100%"
              language="prisma"
              value={value}
              onChange={(newValue) => onChange(newValue || "")}
              onMount={handleEditorDidMount}
              theme="prisma-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
                fontLigatures: true,
                lineNumbers: "on",
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                  showFields: true,
                  showVariables: true,
                  showClasses: true,
                  showModules: true,
                  showProperties: true,
                  showEnums: true,
                  showEnumMembers: true,
                  showTypeParameters: true,
                  snippetsPreventQuickSuggestions: false,
                  filterGraceful: true,
                  localityBonus: true,
                },
                quickSuggestions: {
                  other: "inline",
                  comments: false,
                  strings: false,
                },
                quickSuggestionsDelay: 300,
                parameterHints: {
                  enabled: true,
                  cycle: true,
                },
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoIndent: "full",
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: "off",
                tabCompletion: "on",
                wordBasedSuggestions: "allDocuments",
                folding: true,
                foldingStrategy: "indentation",
                showFoldingControls: "always",
                matchBrackets: "always",
                selectionHighlight: true,
                occurrencesHighlight: "singleFile",
                cursorBlinking: "blink",
                cursorStyle: "line",
                smoothScrolling: true,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                multiCursorModifier: "ctrlCmd",
                mouseWheelZoom: true,
                linkedEditing: true,
                codeLens: true,
                inlineSuggest: {
                  enabled: false,
                  showToolbar: "never",
                },
              }}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Schema Push Failed"
        maxWidth="max-w-lg"
      >
        <div className="text-muted mb-6">
          Failed to push schema to database. Please check your schema for
          errors.
        </div>
        {errorDetails && (
          <div className="bg-step p-4 rounded border border-subtle mb-6">
            <pre className="text-sm text-muted whitespace-pre-wrap break-words">
              {errorDetails}
            </pre>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowErrorModal(false)}
            className="px-4 py-2 text-muted hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showForceResetModal}
        onClose={() => {
          setShowForceResetModal(false);
          setPendingSchema("");
        }}
        title="Database Reset Required"
        maxWidth="max-w-lg"
      >
        <div className="text-muted mb-6">
          This operation will reset your database and lose all data. This is
          required when removing models or making other destructive changes.
        </div>
        <div className="bg-step p-4 rounded border border-subtle mb-6">
          <p className="text-sm text-muted">
            The database will be completely reset and all existing data will be
            lost. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              setShowForceResetModal(false);
              setPendingSchema("");
            }}
            className="px-4 py-2 text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForceReset}
            disabled={isPushing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPushing ? "Resetting..." : "Reset Database"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PrismaSchemaEditor;
