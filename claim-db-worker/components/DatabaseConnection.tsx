"use client";

import React, { useState } from "react";

interface DatabaseConnectionProps {
  connectionType: "prisma" | "direct";
  setConnectionType: (type: "prisma" | "direct") => void;
  getConnectionString: () => string;
  handleCopyConnectionString: () => void;
  copied: boolean;
}

const InlineCode = ({ children }: { children: React.ReactNode }) => (
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
}: DatabaseConnectionProps) {
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="bg-card rounded-md font-mono text-sm flex-1 h-12 border border-subtle min-w-0 flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            value={getConnectionString()}
            readOnly
            className="bg-transparent p-3 text-white text-sm flex-1 outline-none"
            style={{ fontFamily: "monospace" }}
          />
        </div>
        <button
          className="flex items-center justify-center w-12 h-12 border border-subtle rounded-md transition-colors text-muted hover:text-white"
          onClick={() => setShowPassword(!showPassword)}
          title={
            showPassword ? "Hide connection string" : "Show connection string"
          }
        >
          {showPassword ? (
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
                d="M21 9c-2.4 2.667 -5.4 4 -9 4c-3.6 0 -6.6 -1.333 -9 -4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15l2.5 -3.8"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 14.976l-2.492 -3.776"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17l.5 -4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17l-.5 -4"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
        <button
          className="flex items-center justify-center w-12 h-12 border border-subtle rounded-md transition-colors text-muted hover:text-white"
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
                Install Prisma CLI and Client:{" "}
                <InlineCode>npm install prisma --save-dev</InlineCode>
                <br />
                <InlineCode>
                  npm install @prisma/extension-accelerate @prisma/client
                </InlineCode>
              </StepItem>
              <StepItem number={2}>
                Initialize Prisma in your project:{" "}
                <InlineCode>npx prisma init</InlineCode>
              </StepItem>
              <StepItem number={3}>
                Update your <InlineCode>.env</InlineCode> file with the
                connection string:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`DATABASE_URL="${getConnectionString()}"
DIRECT_URL="${getConnectionString()}"`}
                </pre>
              </div>
              <StepItem number={4}>
                Optional: Add Prisma Accelerate for connection pooling and
                caching:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`# Install Accelerate extension
npm install @prisma/extension-accelerate

# Update .env with Accelerate URL (get from https://cloud.prisma.io)
DATABASE_URL="prisma://aws-us-east-1.prisma-data.com/__PROJECT_ID__?api_key=__API_KEY__"
DIRECT_URL="${getConnectionString()}"`}
                </pre>
              </div>
              <StepItem number={5}>
                Configure your <InlineCode>schema.prisma</InlineCode> file:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`}
                </pre>
              </div>
              <StepItem number={6}>
                Push your schema to the database:{" "}
                <InlineCode>npx prisma db push</InlineCode>
              </StepItem>
              <StepItem number={7}>
                Generate Prisma Client:{" "}
                <InlineCode>npx prisma generate</InlineCode>
              </StepItem>
              <StepItem number={8}>
                Create a database client file (e.g.,{" "}
                <InlineCode>lib/prisma.ts</InlineCode>):
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || 
  new PrismaClient().$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`}
                </pre>
              </div>
              <StepItem number={9}>
                Use Prisma Client in your application:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`import { prisma } from './lib/prisma'

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
})

// Query users with caching (if using Accelerate)
const users = await prisma.user.findMany({
  include: {
    // Include related data
  },
})`}
                </pre>
              </div>
              <StepItem number={10}>
                Optional: Use Prisma Studio to view your data:{" "}
                <InlineCode>npx prisma studio</InlineCode>
              </StepItem>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-white mb-4">
              Setup with Direct PostgreSQL Connection:
            </h3>
            <div className="space-y-6">
              <StepItem number={1}>
                Install the PostgreSQL client:{" "}
                <InlineCode>npm install pg @types/pg</InlineCode>
              </StepItem>
              <StepItem number={2}>
                Create a database connection file (e.g.,{" "}
                <InlineCode>lib/db.ts</InlineCode>):
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`import { Pool, Client } from 'pg'

// For connection pooling (recommended for production)
const pool = new Pool({
  connectionString: '${getConnectionString()}',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// For single connections
const client = new Client({
  connectionString: '${getConnectionString()}'
})

export { pool, client }`}
                </pre>
              </div>
              <StepItem number={3}>Create database utility functions:</StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`import { pool } from './lib/db'

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  console.log('Executed query', { text, duration, rows: res.rowCount })
  return res
}

export async function getClient() {
  const client = await pool.connect()
  const query = client.query
  const release = client.release
  
  client.query = (...args) => {
    client.lastQuery = args
    return query.apply(client, args)
  }
  
  client.release = () => {
    client.lastQuery = null
    return release.apply(client)
  }
  
  return client
}`}
                </pre>
              </div>
              <StepItem number={4}>
                Use the connection in your application:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`import { query, getClient } from './lib/db'

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId])

// Transaction example
const client = await getClient()
try {
  await client.query('BEGIN')
  await client.query('INSERT INTO users(name, email) VALUES($1, $2)', ['John', 'john@example.com'])
  await client.query('INSERT INTO profiles(user_id, bio) VALUES($1, $2)', [userId, 'Bio text'])
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
}`}
                </pre>
              </div>
              <StepItem number={5}>
                Create database tables (if needed):
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);`}
                </pre>
              </div>
              <StepItem number={6}>
                Handle connection cleanup in your application:
              </StepItem>
              <div className="ml-12">
                <pre className="bg-step p-4 rounded text-white text-sm overflow-x-auto leading-relaxed">
                  {`// In your main application file
process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
