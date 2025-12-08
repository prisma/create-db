import fs from "fs";
import path from "path";

export function readUserEnvFile(): Record<string, string> {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return {};

    const envContent = fs.readFileSync(envPath, "utf8");
    const envVars: Record<string, string> = {};

    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const [key, ...valueParts] = trimmed.split("=");
            if (key && valueParts.length > 0) {
                const value = valueParts.join("=").replace(/^["']|["']$/g, "");
                envVars[key.trim()] = value.trim();
            }
        }
    }

    return envVars;
}
