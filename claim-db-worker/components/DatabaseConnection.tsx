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
    <div className="bg-code rounded-lg border border-subtle p-6 w-full h-full flex flex-col">
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

      <div className="flex-1 space-y-6">
        {connectionType === "prisma" ? (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with Prisma ORM:
            </h3>
            <ol className="text-lg text-muted space-y-6 list-decimal list-inside">
              <li className="leading-relaxed">
                Create a{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  .env
                </code>{" "}
                file in your project root
              </li>
              <li className="leading-relaxed">
                Add the connection string as{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  DATABASE_URL
                </code>
              </li>
              <li className="leading-relaxed">
                Install Prisma:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  npm install prisma @prisma/client
                </code>
              </li>
              <li className="leading-relaxed">
                Initialize Prisma:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  npx prisma init
                </code>
              </li>
              <li className="leading-relaxed">
                Update your{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  schema.prisma
                </code>{" "}
                with your models
              </li>
              <li className="leading-relaxed">
                Push schema to database:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  npx prisma db push
                </code>
              </li>
              <li className="leading-relaxed">
                Generate client:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  npx prisma generate
                </code>
              </li>
            </ol>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with pg (node-postgres):
            </h3>
            <ol className="text-lg text-muted space-y-6 list-decimal list-inside">
              <li className="leading-relaxed">
                Install pg:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  npm install pg @types/pg
                </code>
              </li>
              <li className="leading-relaxed">Create a client connection:</li>
              <li className="ml-4">
                <pre className="bg-step p-6 rounded text-white text-base mt-3 overflow-x-auto leading-relaxed">
                  {`import { Client } from 'pg';

const client = new Client({
  connectionString: '${getConnectionString()}'
});

await client.connect();`}
                </pre>
              </li>
              <li className="leading-relaxed">
                Execute queries:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  const result = await client.query('SELECT * FROM users')
                </code>
              </li>
              <li className="leading-relaxed">
                Close connection:{" "}
                <code className="bg-step px-3 py-2 rounded text-white text-base">
                  await client.end()
                </code>
              </li>
            </ol>
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
