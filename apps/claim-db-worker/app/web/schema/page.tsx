"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { customToast } from "@/lib/custom-toast";
import Modal from "@/components/Modal";
import { PrismButtonOutline } from "@/components/brand/PrismButton";
import { useDatabase } from "../DatabaseContext";
import { formatPrismaSchema } from "@/lib/prismaSchemaEditor/prismaSchemaUtils";
import {
  createPrismaLanguageConfig,
  createPrismaTheme,
  createCompletionProvider,
  createHoverProvider,
  createFormattingProvider,
  createEditorActions,
} from "@/lib/prismaSchemaEditor/monacoConfig";
import {
  formatSchema,
  pushSchema,
  pullSchema,
  forcePushSchema,
} from "@/lib/prismaSchemaEditor/schemaApi";
import { DEFAULT_PRISMA_SCHEMA } from "@/lib/prismaSchemaEditor/defaultSchema";
import { PRISMA_EDITOR_OPTIONS } from "@/lib/prismaSchemaEditor/editorOptions";
import SidebarActions from "@/components/prismaSchemaEditor/SidebarActions";
import BusyPanel from "@/components/prismaSchemaEditor/BusyPanel";
import InitOverlay from "@/components/prismaSchemaEditor/InitOverlay";
import InfoNote from "@/components/prismaSchemaEditor/InfoNote";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => null,
});

export default function SchemaPage() {
  const { dbInfo } = useDatabase();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [completionDisposable, setCompletionDisposable] = useState<{
    dispose: () => void;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<string>("");
  const [dataLoss, setDataLoss] = useState<string[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  // The editor only renders on the client, so reading the saved schema up
  // front can't make the server and client markup differ.
  const [schemaContent, setSchemaContent] = useState<string>(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem("schema-content")
          : null;
      if (saved) return saved;
    } catch {}
    return DEFAULT_PRISMA_SCHEMA;
  });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("schema-content", schemaContent);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [schemaContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      completionDisposable?.dispose();
    };
  }, [completionDisposable]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    createPrismaLanguageConfig(monaco);
    createPrismaTheme(monaco);
    monaco.editor.setTheme("prisma-light");

    const completionProvider = createCompletionProvider(monaco);
    const hoverProvider = createHoverProvider(monaco);
    const formattingProvider = createFormattingProvider(
      monaco,
      formatPrismaSchema
    );

    setCompletionDisposable({
      dispose: () => {
        completionProvider.dispose();
        hoverProvider.dispose();
        formattingProvider.dispose();
      },
    });

    createEditorActions(monaco, editor, handleFormat);
  };

  const handleFormat = async () => {
    if (!editorRef.current) return;

    setIsFormatting(true);

    try {
      const currentValue = editorRef.current.getValue();
      const formattedSchema = await formatSchema(currentValue);
      editorRef.current.setValue(formattedSchema);
      setSchemaContent(formattedSchema);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(`Network error during format: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      setIsFormatting(false);
    }
  };

  const handlePushToDb = async () => {
    if (!dbInfo.connectionString) {
      customToast("error", "No connection string available");
      return;
    }

    setIsPushing(true);

    try {
      const currentValue = editorRef.current?.getValue() || schemaContent;
      const result = await pushSchema(currentValue, dbInfo.connectionString);

      if (result.requiresForceReset) {
        setPendingSchema(currentValue);
        setDataLoss(result.dataLoss ?? []);
        setShowForceResetModal(true);
        return;
      }

      customToast("success", "Schema pushed to database successfully");
    } catch (error) {
      console.error("Error pushing to database:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromDb = async () => {
    if (!dbInfo.connectionString) return;

    setIsPulling(true);

    try {
      const result = await pullSchema(dbInfo.connectionString);

      if (result.schema) {
        if (!result.isEmpty) {
          customToast("success", "Schema pulled from database successfully");
        }
        setSchemaContent(result.schema);
        if (editorRef.current) {
          editorRef.current.setValue(result.schema);
        }
      } else {
        setErrorDetails("Pull succeeded but no schema returned");
        setShowErrorModal(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsPulling(false);
    }
  };

  const handleForceReset = async () => {
    if (!dbInfo.connectionString || !pendingSchema) return;

    setIsPushing(true);

    try {
      const result = await forcePushSchema(
        pendingSchema,
        dbInfo.connectionString,
        dataLoss
      );
      if (result.requiresForceReset) {
        // The database changed since the user confirmed; show the new list.
        setDataLoss(result.dataLoss ?? []);
        return;
      }
      customToast("success", "Schema pushed to database successfully");
      setShowForceResetModal(false);
      setPendingSchema("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMessage);
      setShowErrorModal(true);
      setShowForceResetModal(false);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] lg:flex-row bg-paper border border-border rounded-2xl rounded-tl-none p-2 gap-2">
      {/* Sidebar - responsive layout */}
      <SidebarActions
        onPush={handlePushToDb}
        onPull={handlePullFromDb}
        onFormat={handleFormat}
        isPushing={isPushing}
        isPulling={isPulling}
        isFormatting={isFormatting}
        hasConnectionString={Boolean(dbInfo.connectionString)}
        isMounted={isMounted}
      />

      {isPulling || isPushing ? (
        <BusyPanel isPulling={isPulling} />
      ) : (
        <div className="flex flex-col h-full w-full">
          <div className="flex-1 p-1 bg-white border border-border flex flex-col rounded-xl relative overflow-hidden">
            <div className="flex-1 w-full h-full">
              <Editor
                language="prisma"
                value={schemaContent}
                onChange={(newValue) => setSchemaContent(newValue || "")}
                onMount={handleEditorDidMount}
                theme="prisma-light"
                options={PRISMA_EDITOR_OPTIONS}
              />
            </div>

            {!isMounted && <InitOverlay />}
          </div>
          <InfoNote />
        </div>
      )}

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Schema Push Failed"
      >
        <div className="text-muted-foreground mb-6">
          Failed to push schema to database. Please check your schema for
          errors.
        </div>
        {errorDetails && (
          <div className="bg-code p-4 rounded-xl border border-border mb-6">
            <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
              {errorDetails}
            </pre>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <PrismButtonOutline size="sm" onClick={() => setShowErrorModal(false)}>
            Close
          </PrismButtonOutline>
        </div>
      </Modal>

      <Modal
        isOpen={showForceResetModal}
        onClose={() => {
          setShowForceResetModal(false);
          setPendingSchema("");
        }}
        title="Confirm Data Loss"
      >
        <div className="text-muted-foreground mb-6">
          Pushing this schema deletes the data stored in:
        </div>
        <div className="bg-prism-red-50 p-4 rounded-xl border border-prism-red-200 mb-6">
          <ul className="text-sm text-prism-red-800 font-mono list-disc pl-5">
            {dataLoss.map((subject) => (
              <li key={subject}>{subject}</li>
            ))}
          </ul>
          <p className="text-sm text-prism-red-800 mt-3">
            Everything else is kept. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <PrismButtonOutline
            size="sm"
            onClick={() => {
              setShowForceResetModal(false);
              setPendingSchema("");
            }}
          >
            Cancel
          </PrismButtonOutline>
          <button
            onClick={handleForceReset}
            disabled={isPushing}
            className="rounded-full bg-prism-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-prism-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPushing ? "Pushing..." : "Delete and Push"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
