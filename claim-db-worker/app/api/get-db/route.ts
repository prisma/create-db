import { getEnv } from "@/lib/env";

export async function POST(request: Request) {
  const env = getEnv();

  const body = (await request.json()) as { projectId?: string };
  const { projectId } = body;

  const databasesResponse = await fetch(
    `https://api.prisma.io/v1/projects/${projectId}/databases`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
      },
    }
  );

  const databases = (await databasesResponse.json()) as any;

  const database = databases.data?.[0];

  if (!database) {
    return Response.json(
      {
        error: "No database found for this project",
      },
      { status: 404 }
    );
  }

  const connectionsResponse = await fetch(
    `https://api.prisma.io/v1/databases/${database.id}/connections`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.INTEGRATION_TOKEN}`,
      },
    }
  );

  const connectionsData = await connectionsResponse.json();

  // Append connections to the database object
  const databaseWithConnections = {
    ...database,
    connections: connectionsData,
  };

  return Response.json({
    database: databaseWithConnections,
  });
}

// {
//   "database": {
//       "createdAt": "2025-08-20T13:05:01.805Z",
//       "id": "db_cmejzj6ng01dl1geu3ieq3bdd",
//       "isDefault": true,
//       "name": "2025-08-20T13:04:59.764Z",
//       "status": "ready",
//       "type": "database",
//       "project": {
//           "id": "proj_cmejzj6nh01dp1geuu6kszjj5",
//           "name": "2025-08-20T13:04:59.764Z"
//       },
//       "region": {
//           "id": "us-east-1",
//           "name": "US East (N. Virginia)"
//       }
//   },
//   "connections": {
//       "data": [
//           {
//               "id": "con_cmejzj6nh01do1geu6rxysqqx",
//               "type": "connection",
//               "name": "Prisma Postgres API Key",
//               "createdAt": "2025-08-20T13:05:01.805Z",
//               "database": {
//                   "id": "db_cmejzj6ng01dl1geu3ieq3bdd",
//                   "name": "2025-08-20T13:04:59.764Z"
//               }
//           }
//       ],
//       "pagination": {
//           "nextCursor": null,
//           "hasMore": false
//       }
//   }
// }
