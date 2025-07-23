## **What is `create-postgres`?**

`create-postgres` is an open-source CLI tool that provisions [**temporary Prisma Postgres databases**](https://www.prisma.io/postgres?utm_source=create_db_npm_docs) with a single command.

Each database is available for **24 hours** by default. To keep the database permanently, you can **claim it for free** using the URL displayed in the CLI output.

This tool is designed for developers who need a fast way to test, prototype, or integrate Prisma Postgres without manual setup or creating an account.

## **Installation and usage**

There is no need to install the tool globally. Simply run:

```bash
npx create-postgres@latest
```

You can also use the following aliases:

```bash
npx create-db@latest
npx create-pg@latest
```

## **Examples**

```bash
npx create-postgres                    # Creates a database in the default region
npx create-postgres --region eu-west-1 # Creates a database in a specific region
npx create-postgres --i                # Interactive region selection

```

## **Available options**

You can run `npx create-postgres --help` or `npx create-postgres -h` to see all the available CLI options:

```
npx create-postgres [options]

Options:
  --region <region>, -r <region>  Specify a region
                                  Available regions:
                                  ap-southeast-1, ap-northeast-1,
                                  eu-central-1, eu-west-3,
                                  us-east-1, us-west-1

  --interactive, -i               Run in interactive mode

  --help, -h                      Show this help message

```

## **CLI output example**

```
┌  🚀 Creating a Prisma Postgres database
│
│  Provisioning a temporary database in us-east-1...
│
│  It will be automatically deleted in 24 hours, but you can claim it.
│
◇  Database created successfully!
│
●  Connect to your database →
│
│    Prisma connection string:
│    prisma+postgres://accelerate.prisma-data.net/?api_key=...
│
│    Standard connection string:
│    postgresql://<username>:<password>@db.prisma.io:5432/postgres
│
◆  Claim your database →
│
│    Want to keep your database? Claim for free:
│    https://create-db.prisma.io?projectID=proj_...
└

```

## **Claiming a database**

When you create a database using `create-postgres`, it is temporary and will be deleted automatically after **24 hours**.

The CLI output includes a **claim URL** that allows you to keep the database permanently for free.

**What claiming does:**

- Moves the database into your Prisma Data Platform account.
- Prevents it from being auto-deleted.
- Lets you continue using the database as a long-term instance.

Example:

```
◆  Claim your database →
│
│    Want to keep your database? Claim for free:
|
│    https://create-db.prisma.io?projectID=proj_...
│
│    Your database will be deleted on 7/24/2025, 2:25:41 AM if not claimed.
```

## **Next steps**

- Refer to the section in the official [Prisma Postgres documentation](https://www.prisma.io/docs/postgres/introduction/npx-create-db).
