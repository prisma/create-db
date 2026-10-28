---
"create-db": minor
---

Hand the claim URL to whoever needs it in every output mode. `--json` adds a `nextStep` field telling the agent or script to give the user the claim URL before the deletion time. `--quiet` prints the claim URL to stderr, and `--env` prints it after writing the file. The claim URL now carries the output mode as `utm_content`.
