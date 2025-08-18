'use client'

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-code">
      <div className="text-center">
        <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-pulse">
          <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
        </svg>
        <p className="text-sm text-muted">Loading editor...</p>
      </div>
    </div>
  ),
});

interface PrismaSchemaEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const PrismaSchemaEditor = ({ value, onChange }: PrismaSchemaEditorProps) => {
  const editorRef = useRef<any>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [lastPush, setLastPush] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [completionDisposable, setCompletionDisposable] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (completionDisposable && typeof completionDisposable.dispose === 'function') {
        completionDisposable.dispose();
      }
    };
  }, [completionDisposable]);

  const isInsideBlock = (linesBefore: string[], currentLine: string, blockType: string): boolean => {
    let openBlocks = 0;
    let inTargetBlock = false;

    for (const line of linesBefore) {
      const trimmed = line.trim();
      if (trimmed.startsWith(blockType)) {
        inTargetBlock = true;
        openBlocks = 1;
      } else if (inTargetBlock) {
        if (trimmed.includes('{')) openBlocks++;
        if (trimmed.includes('}')) openBlocks--;
        if (openBlocks === 0) inTargetBlock = false;
      }
    }

    const currentTrimmed = currentLine.trim();
    if (currentTrimmed.includes('{') && inTargetBlock) openBlocks++;
    if (currentTrimmed.includes('}') && inTargetBlock) openBlocks--;

    return inTargetBlock && openBlocks > 0;
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    monaco.languages.register({ id: 'prisma' });

    monaco.languages.setMonarchTokensProvider('prisma', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/\b(generator|datasource|model|enum|type|view)\b/, 'keyword.control'],
          [/\b(provider|url|relationMode|binaryTargets|previewFeatures|output|directUrl|shadowDatabaseUrl)\b/, 'keyword.other'],
          [/\b(String|Boolean|Int|BigInt|Float|Decimal|DateTime|Json|Bytes|Unsupported)\b/, 'type.primitive'],
          [/@@?[a-zA-Z_]\w*/, 'annotation'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          [/env\s*\(\s*"[^"]*"\s*\)/, 'variable.env'],
          [/\b[A-Z][a-zA-Z0-9_]*\b/, 'type.model'],
          [/\b[a-z][a-zA-Z0-9_]*\b/, 'identifier'],
          [/[?]/, 'operator.optional'],
          [/\[\s*\]/, 'operator.array'],
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[,;]/, 'delimiter'],
          [/[:=]/, 'operator'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ],
      }
    });

    monaco.editor.defineTheme('prisma-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword.control', foreground: '7f9cf5', fontStyle: 'bold' },
        { token: 'keyword.other', foreground: '5a67d8' },
        { token: 'type.primitive', foreground: '71e8df', fontStyle: 'bold' },
        { token: 'type.model', foreground: '16a394' },
        { token: 'annotation', foreground: '667eea' },
        { token: 'string', foreground: '92efe6' },
        { token: 'string.escape', foreground: '04c8bb' },
        { token: 'comment', foreground: 'a0aec0', fontStyle: 'italic' },
        { token: 'number', foreground: '667eea' },
        { token: 'number.float', foreground: '667eea' },
        { token: 'variable.env', foreground: '16a394' },
        { token: 'operator.optional', foreground: 'e2e8f0' },
        { token: 'operator.array', foreground: 'e2e8f0' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'delimiter.bracket', foreground: 'e2e8f0' },
        { token: 'delimiter', foreground: 'cbd5e0' },
        { token: 'operator', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#181b22',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#718096',
        'editorLineNumber.activeForeground': '#e2e8f0',
        'editor.selectionBackground': '#2d3748',
        'editor.selectionHighlightBackground': '#4a5568',
        'editor.wordHighlightBackground': '#4a5568',
        'editor.wordHighlightStrongBackground': '#2d3748',
        'editorCursor.foreground': '#e2e8f0',
        'editorBracketMatch.background': '#2d374850',
        'editorBracketMatch.border': '#5a67d8',
        'editor.lineHighlightBackground': '#2d3748',
        'editorGutter.background': '#181b22',
        'editorWhitespace.foreground': '#4a5568',
        'editorIndentGuide.background': '#4a5568',
        'editorIndentGuide.activeBackground': '#718096',
        'editorRuler.foreground': '#4a5568',
      }
    });

    monaco.editor.setTheme('prisma-dark');

        setCompletionDisposable(
      monaco.languages.registerCompletionItemProvider('prisma', {
        triggerCharacters: ['@', '=', '"', ' ', '\n', '{'],
        provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const line = model.getLineContent(position.lineNumber);
        const beforeCursor = line.substring(0, position.column - 1);
        const allText = model.getValue();
        const linesBefore = allText.split('\n').slice(0, position.lineNumber - 1);
        
        const isInGenerator = isInsideBlock(linesBefore, line, 'generator');
        const isInDatasource = isInsideBlock(linesBefore, line, 'datasource');
        const isInModel = isInsideBlock(linesBefore, line, 'model');
        const isInEnum = isInsideBlock(linesBefore, line, 'enum');
        const isAfterAt = beforeCursor.trim().endsWith('@');
        const isFieldDeclaration = isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/.test(beforeCursor);
        const isFieldType = isInModel && /^\s+[a-zA-Z_][a-zA-Z0-9_]*\s+$/.test(beforeCursor);
        const isPropertyValue = /=\s*$/.test(beforeCursor);
        const isAfterSpace = beforeCursor.endsWith(' ');
        const isNewLine = beforeCursor.trim() === '';
        const isInsideParens = beforeCursor.includes('(') && !beforeCursor.includes(')');

        let suggestions: any[] = [];

        // Only show suggestions in appropriate contexts
        if (isInDatasource && !isPropertyValue) {
          const datasourceProps = [
            { name: 'provider', snippet: 'provider = "${1:postgresql}"' },
            { name: 'url', snippet: 'url = env("${1:DATABASE_URL}")' },
            { name: 'directUrl', snippet: 'directUrl = env("${1:DIRECT_URL}")' },
            { name: 'shadowDatabaseUrl', snippet: 'shadowDatabaseUrl = env("${1:SHADOW_DATABASE_URL}")' }
          ];

          suggestions.push(
            ...datasourceProps.map(prop => ({
              label: prop.name,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: prop.snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            }))
          );
        }

        if (isInDatasource && isPropertyValue && beforeCursor.includes('provider')) {
          const providers = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb', 'cockroachdb'];
          suggestions.push(
            ...providers.map(provider => ({
              label: `"${provider}"`,
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: `"${provider}"`,
              range
            }))
          );
        }

        if (isInModel && isNewLine && !isFieldType && !isAfterAt) {
          suggestions.push(
            {
              label: 'id',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'id    ${1|Int,String|} @id @default(${2|autoincrement(),cuid(),uuid()|})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Primary key field',
              range,
              sortText: '1'
            },
            {
              label: 'field',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '${1:fieldName} ${2|String,Int,Boolean,DateTime,Float,Decimal,Json,Bytes|} ${3:@unique}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Basic field',
              range,
              sortText: '2'
            },
            {
              label: 'createdAt',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'createdAt DateTime @default(now())',
              documentation: 'Creation timestamp field',
              range,
              sortText: '3'
            },
            {
              label: 'updatedAt',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'updatedAt DateTime @updatedAt',
              documentation: 'Update timestamp field',
              range,
              sortText: '4'
            }
          );
        }

        if (isFieldType) {
          const fieldTypes = [
            { name: 'String', desc: 'Variable length text' },
            { name: 'Boolean', desc: 'True or false value' },
            { name: 'Int', desc: '32-bit signed integer' },
            { name: 'BigInt', desc: '64-bit signed integer' },
            { name: 'Float', desc: 'Floating point number' },
            { name: 'Decimal', desc: 'High precision decimal' },
            { name: 'DateTime', desc: 'Timestamp' },
            { name: 'Json', desc: 'JSON object' },
            { name: 'Bytes', desc: 'Binary data' },
            { name: 'String?', desc: 'Optional string' },
            { name: 'Int?', desc: 'Optional integer' },
            { name: 'Boolean?', desc: 'Optional boolean' },
            { name: 'DateTime?', desc: 'Optional timestamp' },
            { name: 'String[]', desc: 'Array of strings' },
            { name: 'Int[]', desc: 'Array of integers' }
          ];

          suggestions.push(
            ...fieldTypes.map(type => ({
              label: type.name,
              kind: monaco.languages.CompletionItemKind.TypeParameter,
              insertText: type.name,
              documentation: type.desc,
              range,
              sortText: type.name.includes('?') ? '2' : type.name.includes('[]') ? '3' : '1'
            }))
          );
        }

        if (isAfterAt) {
          const attributes = [
            { name: 'id', snippet: 'id', desc: 'Defines the primary key' },
            { name: 'unique', snippet: 'unique', desc: 'Defines a unique constraint' },
            { name: 'default', snippet: 'default(${1:value})', desc: 'Sets a default value' },
            { name: 'relation', snippet: 'relation(fields: [${1:fieldName}], references: [${2:id}])', desc: 'Defines a relation' },
            { name: 'updatedAt', snippet: 'updatedAt', desc: 'Auto-updates timestamp' },
            { name: 'map', snippet: 'map("${1:column_name}")', desc: 'Maps to database column' },
            { name: 'db', snippet: 'db.${1:VarChar(255)}', desc: 'Database-specific attribute' },
            { name: 'ignore', snippet: 'ignore', desc: 'Excludes field from client' }
          ];

          suggestions.push(
            ...attributes.map(attr => ({
              label: `@${attr.name}`,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: `@${attr.snippet}`,
              insertTextRules: attr.snippet.includes('$') ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
              documentation: attr.desc,
              range,
              sortText: '1'
            }))
          );
        }

        if (isInsideParens && beforeCursor.includes('@default(')) {
          const functions = [
            { name: 'autoincrement()', desc: 'Auto-incrementing integer' },
            { name: 'cuid()', desc: 'Collision-resistant unique identifier' },
            { name: 'uuid()', desc: 'UUID v4' },
            { name: 'now()', desc: 'Current timestamp' },
            { name: 'env("DATABASE_URL")', desc: 'Environment variable' },
            { name: 'dbgenerated("expression")', desc: 'Database-generated value' }
          ];

          suggestions.push(
            ...functions.map(func => ({
              label: func.name,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func.name,
              documentation: func.desc,
              range,
              sortText: '1'
            }))
          );
        }

        if (isInGenerator && !isPropertyValue) {
          const generatorProps = [
            { name: 'provider', snippet: 'provider = "${1:prisma-client-js}"' },
            { name: 'output', snippet: 'output = "${1:../generated/client}"' },
            { name: 'previewFeatures', snippet: 'previewFeatures = [${1:"relationJoins"}]' },
            { name: 'binaryTargets', snippet: 'binaryTargets = [${1:"native"}]' }
          ];

          suggestions.push(
            ...generatorProps.map(prop => ({
              label: prop.name,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: prop.snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range
            }))
          );
        }

        if (isInGenerator && isPropertyValue) {
          if (beforeCursor.includes('provider')) {
            suggestions.push(
              { label: '"prisma-client"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client"', range },
              { label: '"prisma-client-js"', kind: monaco.languages.CompletionItemKind.Value, insertText: '"prisma-client-js"', range }
            );
          } else if (beforeCursor.includes('previewFeatures')) {
            const features = ['relationJoins', 'fullTextSearch', 'postgresqlExtensions', 'views', 'multiSchema'];
            suggestions.push(
              ...features.map(feature => ({
                label: `"${feature}"`,
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: `"${feature}"`,
                range
              }))
            );
          }
        }

        if (!isInGenerator && !isInDatasource && !isInModel && !isInEnum) {
          if (isNewLine || /^\s*(gen|mod|dat|enu|typ|vie)/.test(line)) {
            suggestions.push(
              {
                label: 'generator',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: [
                  'generator ${1:client} {',
                  '  provider = "prisma-client"',
                  '  output   = "../generated/prisma/client"',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a code generator',
                range,
                sortText: '1'
              },
              {
                label: 'model',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: [
                  'model ${1:User} {',
                  '  id    Int     @id @default(autoincrement())',
                  '  email String  @unique',
                  '  name  String?',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a data model',
                range,
                sortText: '2'
              },
              {
                label: 'datasource',
                kind: monaco.languages.CompletionItemKind.Module,
                insertText: [
                  'datasource ${1:db} {',
                  '  provider = "${2:postgresql}"',
                  '  url      = env("${3:DATABASE_URL}")',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a datasource',
                range,
                sortText: '3'
              },
              {
                label: 'enum',
                kind: monaco.languages.CompletionItemKind.Enum,
                insertText: [
                  'enum ${1:Role} {',
                  '  ${2:USER}',
                  '  ${3:ADMIN}',
                  '  $0',
                  '}'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define an enumeration',
                range,
                sortText: '4'
              }
            );
          }
        }

        if (isInEnum && isNewLine) {
          suggestions.push({
            label: 'enum value',
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: '${1:VALUE}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          });
        }

        return { suggestions };
      }
    })
    );

    const hoverProvider = monaco.languages.registerHoverProvider('prisma', {
      provideHover: (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const documentation: { [key: string]: string } = {
          'model': '**Model** - Represents an entity in your application domain and maps to a table (relational databases) or collection (MongoDB)',
          'generator': '**Generator** - Determines which assets are created from your Prisma schema',
          'datasource': '**Datasource** - Tells Prisma what database you use and how to connect to it',
          'enum': '**Enum** - Defines a list of possible values for a field',
          '@id': '**@id** - Defines a single-field ID on the model',
          '@unique': '**@unique** - Defines a unique constraint for this field',
          '@default': '**@default** - Defines a default value for this field',
          '@relation': '**@relation** - Defines meta information about the relation',
          '@updatedAt': '**@updatedAt** - Automatically stores the time when a record was last updated',
          '@map': '**@map** - Maps a field name or enum value from the Prisma schema to a column or document field name in the database',
          'String': '**String** - Variable length text',
          'Boolean': '**Boolean** - True or false value',
          'Int': '**Int** - 32-bit signed integer',
          'BigInt': '**BigInt** - 64-bit signed integer',
          'Float': '**Float** - Floating point number',
          'Decimal': '**Decimal** - High precision floating point number',
          'DateTime': '**DateTime** - Timestamp',
          'Json': '**Json** - JSON object',
          'Bytes': '**Bytes** - Raw bytes (binary data)',
          'autoincrement': '**autoincrement()** - Creates a sequence of integers in the underlying database',
          'cuid': '**cuid()** - Generates a globally unique identifier based on the cuid spec',
          'uuid': '**uuid()** - Generates a globally unique identifier based on the UUID spec',
          'now': '**now()** - Sets a timestamp of the time when a record is created'
        };

        if (documentation[word.word]) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [{ value: documentation[word.word] }]
          };
        }
      }
    });

    monaco.languages.registerDocumentFormattingEditProvider('prisma', {
      provideDocumentFormattingEdits: (model: any) => {
        const value = model.getValue();
        const formatted = value
          .split('\n')
          .map((line: string) => {
            line = line.trimEnd();
            
            if (line.trim().match(/^(id|email|name|title|content|published|author|authorId|createdAt|updatedAt|provider|url)\s+/)) {
              const trimmed = line.trim();
              return `  ${trimmed}`;
            }
            
            if (line.trim().match(/^(model|generator|datasource|enum)\s+/)) {
              return line.trim();
            }
            
            if (line.trim() === '}') {
              return '}';
            }
            
            return line;
          })
          .join('\n');

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });

    editor.addAction({
      id: 'prisma.format',
      label: 'Format Prisma Schema',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => {
        handleFormat();
      }
    });
  };

  const handleFormat = async () => {
    if (!editorRef.current) return;
    
    setIsFormatting(true);

    try {
      const currentValue = editorRef.current.getValue();
      
      const response = await fetch('/api/format-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: currentValue }),
      });

      if (response.ok) {
        const { formattedSchema } = await response.json() as { formattedSchema: string };
        editorRef.current.setValue(formattedSchema);
        onChange(formattedSchema);
        
        console.log("Schema formatted successfully using Prisma's official formatter");
      } else {
        await editorRef.current.trigger('format', 'editor.action.formatDocument', {});
        
        console.log("Used Monaco editor formatting as Prisma formatter was unavailable");
      }
    } catch (error) {
      console.error('Error formatting:', error);
      
      try {
        await editorRef.current.trigger('format', 'editor.action.formatDocument', {});
        
        console.log("Used Monaco editor formatting due to an error with Prisma formatter");
      } catch (fallbackError) {
        console.error('Fallback formatting failed:', fallbackError);
        
        console.error("Unable to format schema. Please check your syntax.");
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handlePushToDb = async () => {
    setIsPushing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastPush(new Date());
      console.log("Schema pushed to database successfully");
    } catch (error) {
      console.error('Error pushing to database:', error);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-code">
        <div className="text-center">
          <svg width="48" height="60" viewBox="0 0 58 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 animate-pulse">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.522473 45.0933C-0.184191 46.246 -0.173254 47.7004 0.550665 48.8423L13.6534 69.5114C14.5038 70.8529 16.1429 71.4646 17.6642 71.0082L55.4756 59.6648C57.539 59.0457 58.5772 56.7439 57.6753 54.7874L33.3684 2.06007C32.183 -0.511323 28.6095 -0.722394 27.1296 1.69157L0.522473 45.0933ZM32.7225 14.1141C32.2059 12.9187 30.4565 13.1028 30.2001 14.3796L20.842 60.9749C20.6447 61.9574 21.5646 62.7964 22.5248 62.5098L48.6494 54.7114C49.4119 54.4838 49.8047 53.6415 49.4891 52.9111L32.7225 14.1141Z" fill="white"/>
          </svg>
          <p className="text-sm text-muted">Initializing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-code rounded-lg p-1.5">
            <div className="w-16 rounded-lg bg-step flex flex-col justify-between items-center py-2">
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handlePushToDb}
            disabled={isPushing}
            className="w-12 h-12 p-0 flex flex-col items-center justify-center rounded-md text-muted hover:text-white hover:bg-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Push schema to database (prisma db push)"
          >
            {isPushing ? (
              <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
                <path d="M3 12A9 3 0 0 0 21 12"/>
              </svg>
            )}
            <span className="text-xs font-bold mt-1">Push</span>
          </button>

          <button
            onClick={handleFormat}
            disabled={isFormatting}
            className={`w-12 h-12 p-0 flex flex-col items-center justify-center text-muted hover:text-white hover:bg-button rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormatting ? 'bg-button text-white' : ''
            }`}
            title={isFormatting ? "Formatting schema..." : "Format schema (Shift+Alt+F)"}
          >
            {isFormatting ? (
              <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/>
                <path d="m5 2 5 5"/>
                <path d="M2 13h15"/>
                <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>
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
              {lastPush.toLocaleTimeString().split(' ')[0]}
            </span>
          </div>
        )}
        
      </div>

      <div className="flex-1 flex flex-col rounded-lg">
        <div className="flex-1">
          <Editor
            height="100%"
            language="prisma"
            value={value}
            onChange={(newValue) => onChange(newValue || '')}
            onMount={handleEditorDidMount}
            theme="prisma-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderWhitespace: 'selection',
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
                other: 'inline',
                comments: false,
                strings: false,
              },
              quickSuggestionsDelay: 300,
              parameterHints: { 
                enabled: true,
                cycle: true
              },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'full',
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'off',
              tabCompletion: 'on',
              wordBasedSuggestions: 'allDocuments',
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'always',
              matchBrackets: 'always',
              selectionHighlight: true,
              occurrencesHighlight: 'singleFile',
              cursorBlinking: 'blink',
              cursorStyle: 'line',
              smoothScrolling: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              multiCursorModifier: 'ctrlCmd',
              mouseWheelZoom: true,
              linkedEditing: true,
              codeLens: true,
              inlineSuggest: {
                enabled: false,
                showToolbar: 'never',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrismaSchemaEditor;
