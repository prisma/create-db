import { isInsideBlock } from "./prismaSchemaUtils";

export const createPrismaLanguageConfig = (monaco: any) => {
  monaco.languages.register({ id: "prisma" });

  monaco.languages.setMonarchTokensProvider("prisma", {
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/\b(generator|datasource|model|enum|type|view)\b/, "keyword.control"],
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
};

// Light editor theme on the brand palette. Token colours use the darker steps
// of the prism scales (700–800) so they hold contrast on white; the bright
// anchors only appear as accents (cursor, bracket match).
export const createPrismaTheme = (monaco: any) => {
  monaco.editor.defineTheme("prisma-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword.control", foreground: "af0a33", fontStyle: "bold" }, // prism-red-700
      { token: "keyword.other", foreground: "af0a33" },
      { token: "type.primitive", foreground: "007f8d", fontStyle: "bold" }, // prism-cyan-700
      { token: "type.model", foreground: "006772" }, // prism-cyan-800
      { token: "annotation", foreground: "965100" }, // prism-yellow-700
      { token: "string", foreground: "7a4200" }, // prism-yellow-800
      { token: "string.escape", foreground: "965100" },
      { token: "comment", foreground: "646567", fontStyle: "italic" }, // text secondary
      { token: "number", foreground: "d02344" }, // prism-red-600
      { token: "number.float", foreground: "d02344" },
      { token: "variable.env", foreground: "006772" },
      { token: "operator.optional", foreground: "3a3b3c" },
      { token: "operator.array", foreground: "3a3b3c" },
      { token: "identifier", foreground: "151515" }, // ink
      { token: "delimiter.bracket", foreground: "3a3b3c" },
      { token: "delimiter", foreground: "646567" },
      { token: "operator", foreground: "3a3b3c" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#151515",
      "editorLineNumber.foreground": "#a3a4a6",
      "editorLineNumber.activeForeground": "#3a3b3c",
      "editor.selectionBackground": "#b3f4f9", // prism-cyan-200
      "editor.inactiveSelectionBackground": "#dcfdff",
      "editor.selectionHighlightBackground": "#dcfdff",
      "editor.wordHighlightBackground": "#fcedc2", // prism-yellow-100
      "editor.wordHighlightStrongBackground": "#f8da85",
      "editorCursor.foreground": "#151515",
      "editorBracketMatch.background": "#dcfdff",
      "editorBracketMatch.border": "#01d7e4", // prism-cyan-400
      "editor.lineHighlightBackground": "#f9faf5", // paper
      "editor.lineHighlightBorder": "#f9faf5",
      "editorGutter.background": "#ffffff",
      "editorWhitespace.foreground": "#e5e5e5",
      "editorIndentGuide.background": "#ececec",
      "editorIndentGuide.activeBackground": "#c9cacc",
      "editorRuler.foreground": "#ececec",
    },
  });
};

export const createCompletionProvider = (monaco: any) => {
  return monaco.languages.registerCompletionItemProvider("prisma", {
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
      const linesBefore = allText.split("\n").slice(0, position.lineNumber - 1);

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
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
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
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
  });
};

export const createHoverProvider = (monaco: any) => {
  return monaco.languages.registerHoverProvider("prisma", {
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
};

export const createFormattingProvider = (
  monaco: any,
  formatPrismaSchema: (schema: string) => string
) => {
  return monaco.languages.registerDocumentFormattingEditProvider("prisma", {
    provideDocumentFormattingEdits: (model: any) => {
      const value = model.getValue();
      const formatted = formatPrismaSchema(value);

      return [
        {
          range: model.getFullModelRange(),
          text: formatted,
        },
      ];
    },
  });
};

export const createEditorActions = (
  monaco: any,
  editor: any,
  handleFormat: () => void
) => {
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
