"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { customToast } from "@/lib/custom-toast";
import Modal from "@/components/Modal";
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
  const editorRef = useRef<any>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPageRefresh, setIsPageRefresh] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const first = !sessionStorage.getItem("editor-initialized");
      if (first) {
        sessionStorage.setItem("editor-initialized", "true");
        return true;
      }
    }
    return false;
  });
  const [completionDisposable, setCompletionDisposable] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [pendingSchema, setPendingSchema] = useState<string>("");
  const [isPulling, setIsPulling] = useState(false);
  const [schemaContent, setSchemaContent] = useState<string>(
    DEFAULT_PRISMA_SCHEMA
  );

  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? sessionStorage.getItem("schema-content")
          : null;
      if (saved) {
        setSchemaContent(saved);
      }
    } catch {}
  }, []);

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
      if (
        completionDisposable &&
        typeof completionDisposable.dispose === "function"
      ) {
        completionDisposable.dispose();
      }
    };
  }, [completionDisposable]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    createPrismaLanguageConfig(monaco);
    createPrismaTheme(monaco);
    monaco.editor.setTheme("prisma-dark");

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
        setShowForceResetModal(true);
        return;
      }

      customToast("success", "Schema pushed to database successfully");
    } catch (error) {
      console.error("Error pushing to database:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(`Network error during push: ${errorMessage}`);
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
      setErrorDetails(`Network error during pull: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      setIsPulling(false);
    }
  };

  const handleForceReset = async () => {
    if (!dbInfo.connectionString || !pendingSchema) return;

    setIsPushing(true);

    try {
      await forcePushSchema(pendingSchema, dbInfo.connectionString);
      customToast("success", "Schema pushed to database successfully");
      setShowForceResetModal(false);
      setPendingSchema("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorDetails(`Network error during force reset: ${errorMessage}`);
      setShowErrorModal(true);
      setShowForceResetModal(false);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] lg:flex-row bg-code rounded-lg rounded-tl-none p-2 gap-2">
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
          <div className="flex-1 p-1 bg-[#181b21] flex flex-col rounded-lg relative">
            <div className="flex-1 w-full h-full">
              <Editor
                language="prisma"
                value={schemaContent}
                onChange={(newValue) => setSchemaContent(newValue || "")}
                onMount={handleEditorDidMount}
                theme="prisma-dark"
                options={PRISMA_EDITOR_OPTIONS as any}
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
}
