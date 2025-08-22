interface DatabaseConnectionProps {
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  getConnectionString: () => string;
  handleCopyConnectionString: () => void;
  copied: boolean;
  connectionStringsVisible: boolean;
  onGetNewConnectionStrings: () => void;
  fetchingNewConnections: boolean;
}

const CodeSnippet = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-step px-3 py-2 rounded text-white text-base">
    {children}
  </code>
);

const StepNumber = ({ number }: { number: number }) => (
  <div className="flex-shrink-0 w-8 h-8 bg-table-header rounded-full flex items-center justify-center text-white text-sm font-medium">
    {number}
  </div>
);

const StepItem = ({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4">
    <StepNumber number={number} />
    <div className="flex-1 leading-relaxed text-lg text-muted">{children}</div>
  </div>
);

export default function DatabaseConnection({
  connectionType,
  setConnectionType,
  getConnectionString,
  handleCopyConnectionString,
  copied,
  connectionStringsVisible,
  onGetNewConnectionStrings,
  fetchingNewConnections,
}: DatabaseConnectionProps) {
  return (
    <div className="bg-card rounded-lg border border-subtle p-6 w-full h-full flex flex-col">
      <div className="flex bg-step rounded-md p-1 w-full mb-3">
        <button
          className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors font-medium ${
            connectionType === "prisma"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => setConnectionType("prisma")}
        >
          With Prisma ORM
        </button>
        <button
          className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors font-medium ${
            connectionType === "direct"
              ? "bg-table-header text-white"
              : "text-muted hover:text-white"
          }`}
          onClick={() => setConnectionType("direct")}
        >
          Direct Connection
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div
          className="bg-card p-3 rounded-md font-mono text-sm flex-1 h-12 text-white border border-subtle min-w-0 overflow-x-auto custom-scrollbar"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent",
            scrollbarGutter: "stable",
          }}
        >
          <div className="whitespace-nowrap flex items-center h-full">
            {getConnectionString()}
          </div>
        </div>
        <button
          className="flex items-center justify-center w-12 h-12 text-muted border border-subtle rounded-md hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onGetNewConnectionStrings}
          disabled={fetchingNewConnections}
          title="Regenerate connection strings"
        >
          {fetchingNewConnections ? (
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </button>
        <button
          className="flex items-center justify-center w-12 h-12 text-muted border border-subtle rounded-md hover:text-white transition-colors"
          onClick={handleCopyConnectionString}
          title="Copy connection string"
        >
          {copied ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="text-sm text-muted mb-6">
        {connectionType === "prisma"
          ? "Add this to your .env file as DATABASE_URL for use with Prisma ORM"
          : "Use this connection string directly with your PostgreSQL client"}
      </p>

      <div className="flex-1 space-y-6 bg-dark rounded-lg p-6">
        {connectionType === "prisma" ? (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with Prisma ORM:
            </h3>
            <div className="space-y-6">
              <StepItem number={1}>
                Create a <CodeSnippet>.env</CodeSnippet> file in your project
                root
              </StepItem>
              <StepItem number={2}>
                Add the connection string as{" "}
                <CodeSnippet>DATABASE_URL</CodeSnippet>
              </StepItem>
              <StepItem number={3}>
                Install Prisma:{" "}
                <CodeSnippet>npm install prisma @prisma/client</CodeSnippet>
              </StepItem>
              <StepItem number={4}>
                Initialize Prisma: <CodeSnippet>npx prisma init</CodeSnippet>
              </StepItem>
              <StepItem number={5}>
                Update your <CodeSnippet>schema.prisma</CodeSnippet> with your
                models
              </StepItem>
              <StepItem number={6}>
                Push schema to database:{" "}
                <CodeSnippet>npx prisma db push</CodeSnippet>
              </StepItem>
              <StepItem number={7}>
                Generate client: <CodeSnippet>npx prisma generate</CodeSnippet>
              </StepItem>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with pg (node-postgres):
            </h3>
            <div className="space-y-6">
              <StepItem number={1}>
                Install pg: <CodeSnippet>npm install pg @types/pg</CodeSnippet>
              </StepItem>
              <StepItem number={2}>Create a client connection:</StepItem>
              <div className="ml-12">
                <pre className="bg-step p-6 rounded text-white text-base overflow-x-auto leading-relaxed">
                  {`import { Client } from 'pg';

const client = new Client({
  connectionString: '${getConnectionString()}'
});

await client.connect();`}
                </pre>
              </div>
              <StepItem number={3}>
                Execute queries:{" "}
                <CodeSnippet>
                  const result = await client.query('SELECT * FROM users')
                </CodeSnippet>
              </StepItem>
              <StepItem number={4}>
                Close connection: <CodeSnippet>await client.end()</CodeSnippet>
              </StepItem>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-card rounded border border-subtle">
        <p className="text-sm text-muted">
          <strong>Note:</strong> This database will be automatically deleted
          after 24 hours unless claimed.
        </p>
      </div>
    </div>
  );
}
