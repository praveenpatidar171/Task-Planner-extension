import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { SessionStore } from './sessionStore';

const MAX_LINES = 15; // Limit number of lines to read per file
const COMMON_DIRS = ["frontend", "backend", "client", "server", "api", "web"];

export async function scanProject(refreshScan = false): Promise<{ frameworks: string[], databases: string[], otherTools: string[] }> {
    const cachedTechStack = SessionStore.getInstance().getTechStack();
    if (!refreshScan && cachedTechStack) {
        console.log("Using cached tech stack.");
        return cachedTechStack;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return { frameworks: [], databases: [], otherTools: [] };
    }

    const projectPath = workspaceFolders[0].uri.fsPath;

    let techStack = { frameworks: new Set<string>(), databases: new Set<string>(), otherTools: new Set<string>() };

    console.log("Starting project scan at:", projectPath);

    function readJsonFile(filePath: string) {
        if (!fs.existsSync(filePath)) return null;
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading JSON file in ${filePath}: ${(error as Error).message}`);
            return null;
        }
    }

    function updateTechStack(dependencies: Record<string, string>) {
        if (!dependencies) return;

        const frameworkMappings: Record<string, string> = {
            "express": "Express.js",
            "next": "Next.js",
            "react": "React.js",
            "vue": "Vue.js",
            "flask": "Flask",
            "django": "Django",
            "fastapi": "FastAPI",
            "gin-gonic": "Gin (Go)",
            "echo": "Echo (Go)",
            "fiber": "Fiber (Go)",
            "spring-boot": "Spring Boot"
        };

        const databaseMappings: Record<string, string> = {
            "mongoose": "MongoDB (Mongoose)",
            "prisma": "Prisma (PostgreSQL/MySQL)",
            "sequelize": "Sequelize (SQL)",
            "pymongo": "MongoDB",
            "sqlalchemy": "PostgreSQL",
            "gorm": "PostgreSQL (GORM)"
        };

        const toolMappings: Record<string, string> = {
            "socket.io": "Socket.io (WebSockets)",
            "graphql": "GraphQL API",
            "tailwindcss": "Tailwind CSS",
            "docker": "Docker"
        };

        Object.keys(dependencies).forEach(dep => {
            if (frameworkMappings[dep]) techStack.frameworks.add(frameworkMappings[dep]);
            if (databaseMappings[dep]) techStack.databases.add(databaseMappings[dep]);
            if (toolMappings[dep]) techStack.otherTools.add(toolMappings[dep]);
        });
    }

    // Read package.json in root and subdirectories **parallel**
    const packageJsonPaths = [
        path.join(projectPath, "package.json"),
        ...COMMON_DIRS.map(dir => path.join(projectPath, dir, "package.json"))
    ];

    await Promise.all(packageJsonPaths.map(async (pkgPath) => {
        const packageJson = readJsonFile(pkgPath);
        if (packageJson) updateTechStack({ ...packageJson.dependencies, ...packageJson.devDependencies });
    }));

    async function scanDirectory(directory: string): Promise<string[]> {
        if (!fs.existsSync(directory)) return [];
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        const files = await Promise.all(entries.map(async (entry) => {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) return scanDirectory(fullPath);
            if (/\.(js|ts|jsx|tsx|py|go|java)$/i.test(entry.name)) return fullPath;
            return [];
        }));
        return files.flat();
    }

    async function readFileLines(filePath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { encoding: "utf8" });
            let lines: string[] = [];
            let buffer = "";

            stream.on("data", chunk => {
                buffer += chunk;
                let parts = buffer.split("\n");
                buffer = parts.pop() || "";
                lines.push(...parts);
                if (lines.length >= MAX_LINES) {
                    stream.destroy();
                }
            });

            stream.on("close", () => resolve(lines.slice(0, MAX_LINES)));
            stream.on("error", err => reject(err));
        });
    }

    const existingDirs = COMMON_DIRS.map(dir => path.join(projectPath, dir)).filter(dirPath => fs.existsSync(dirPath));
    const allFiles = (await Promise.all(existingDirs.map(scanDirectory))).flat();

    console.log(`📂 Found ${allFiles.length} relevant files.`);

    const fileContents = await Promise.allSettled(allFiles.map(readFileLines));

    const keywordMappings: Record<string, { category: keyof typeof techStack, name: string }> = {
        "flask": { category: "frameworks", name: "Flask" },
        "django": { category: "frameworks", name: "Django" },
        "fastapi": { category: "frameworks", name: "FastAPI" },
        "psycopg2": { category: "databases", name: "PostgreSQL" },
        "sqlalchemy": { category: "databases", name: "PostgreSQL" },
        "pymongo": { category: "databases", name: "MongoDB" },
        "socket.io": { category: "otherTools", name: "Socket.io" },
        "graphql": { category: "otherTools", name: "GraphQL API" },
        "tailwind": { category: "otherTools", name: "Tailwind CSS" }
    };

    for (let i = 0; i < allFiles.length; i++) {
        if (fileContents[i].status === "fulfilled") {
            const fileData = (fileContents[i] as PromiseFulfilledResult<string[]>).value.join("\n").toLowerCase();
            Object.entries(keywordMappings).forEach(([keyword, { category, name }]) => {
                if (fileData.includes(keyword)) techStack[category].add(name);
            });
        }
    }

    if (fs.existsSync(path.join(projectPath, "docker-compose.yml"))) {
        techStack.otherTools.add("Docker");
    }

    if (fs.existsSync(path.join(projectPath, "tailwind.config.js"))) {
        techStack.otherTools.add("Tailwind CSS");
    }

    const finalTechStack = {
        frameworks: Array.from(techStack.frameworks),
        databases: Array.from(techStack.databases),
        otherTools: Array.from(techStack.otherTools)
    };

    SessionStore.getInstance().setTechStack(finalTechStack);
    console.log("Scan complete. Cached result stored in session.");

    return finalTechStack;
}
