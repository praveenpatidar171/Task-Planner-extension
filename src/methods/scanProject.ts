import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";

export function scanProject(): { frameworks: string[]; databases: string[]; otherTools: string[] } {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder found.");
        return { frameworks: [], databases: [], otherTools: [] };
    }

    const projectPath = workspaceFolders[0].uri.fsPath;

    let techStack: {
        frameworks: string[];
        databases: string[];
        otherTools: string[];
    } = { frameworks: [], databases: [], otherTools: [] };

    // Function to read a JSON file safely
    function readJsonFile(filePath: string) {
        if (!fs.existsSync(filePath)) return null;
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading JSON file in ${filePath}: ${(error as Error).message}`);
            return null;
        }
    }

    // Function to update techStack based on dependencies
    function updateTechStack(dependencies: Record<string, string>) {
        if (!dependencies) return;

        // Detect JavaScript/TypeScript frameworks
        if (dependencies["express"]) techStack.frameworks.push("Express.js");
        if (dependencies["next"]) techStack.frameworks.push("Next.js");
        if (dependencies["react"]) techStack.frameworks.push("React.js");
        if (dependencies["vue"]) techStack.frameworks.push("Vue.js");

        // Detect databases
        if (dependencies["mongoose"]) techStack.databases.push("MongoDB (Mongoose)");
        if (dependencies["prisma"]) techStack.databases.push("Prisma (PostgreSQL/MySQL)");
        if (dependencies["sequelize"]) techStack.databases.push("Sequelize (SQL)");

        // Detect other tools
        if (dependencies["socket.io"]) techStack.otherTools.push("Socket.io (WebSockets)");
        if (dependencies["graphql"]) techStack.otherTools.push("GraphQL API");
        if (dependencies["tailwindcss"]) techStack.otherTools.push("Tailwind CSS");
        if (dependencies["@prisma/client"] || dependencies["prisma"]) techStack.otherTools.push("Prisma (ORM)");
    }

    // Scan root package.json
    const rootPackageJson = readJsonFile(path.join(projectPath, "package.json"));
    if (rootPackageJson) updateTechStack({ ...rootPackageJson.dependencies, ...rootPackageJson.devDependencies });

    // Check common subdirectories for package.json
    const subDirs = ["frontend", "backend", "client", "server"];
    for (const dir of subDirs) {
        const subDirPath = path.join(projectPath, dir);
        if (fs.existsSync(subDirPath)) {
            const subPackageJson = readJsonFile(path.join(subDirPath, "package.json"));
            if (subPackageJson) updateTechStack({ ...subPackageJson.dependencies, ...subPackageJson.devDependencies });
        }
    }

    // ✅ **Detect Python (Flask, Django, FastAPI)**
    const requirementsPath = path.join(projectPath, "requirements.txt");
    const pyprojectPath = path.join(projectPath, "pyproject.toml");

    if (fs.existsSync(requirementsPath)) {
        const requirements = fs.readFileSync(requirementsPath, "utf8").toLowerCase();
        if (requirements.includes("flask")) techStack.frameworks.push("Flask");
        if (requirements.includes("django")) techStack.frameworks.push("Django");
        if (requirements.includes("fastapi")) techStack.frameworks.push("FastAPI");
        if (requirements.includes("psycopg2") || requirements.includes("sqlalchemy")) techStack.databases.push("PostgreSQL");
        if (requirements.includes("pymongo")) techStack.databases.push("MongoDB");
    }

    if (fs.existsSync(pyprojectPath)) {
        const pyproject = fs.readFileSync(pyprojectPath, "utf8").toLowerCase();
        if (pyproject.includes("flask")) techStack.frameworks.push("Flask");
        if (pyproject.includes("django")) techStack.frameworks.push("Django");
        if (pyproject.includes("fastapi")) techStack.frameworks.push("FastAPI");
    }

    // ✅ **Detect Go (Gin, Echo, Fiber)**
    const goModPath = path.join(projectPath, "go.mod");
    if (fs.existsSync(goModPath)) {
        const goMod = fs.readFileSync(goModPath, "utf8").toLowerCase();
        if (goMod.includes("github.com/gin-gonic/gin")) techStack.frameworks.push("Gin (Go)");
        if (goMod.includes("github.com/labstack/echo")) techStack.frameworks.push("Echo (Go)");
        if (goMod.includes("github.com/gofiber/fiber")) techStack.frameworks.push("Fiber (Go)");
        if (goMod.includes("gorm.io/gorm")) techStack.databases.push("PostgreSQL (GORM)");
    }

    // ✅ **Detect Java (Spring Boot)**
    const pomPath = path.join(projectPath, "pom.xml");
    const gradlePath = path.join(projectPath, "build.gradle");

    if (fs.existsSync(pomPath) || fs.existsSync(gradlePath)) {
        techStack.frameworks.push("Spring Boot");
        if (fs.readFileSync(pomPath, "utf8").includes("<artifactId>postgresql</artifactId>")) {
            techStack.databases.push("PostgreSQL");
        }
    }

    // ✅ **Check for Docker**
    if (fs.existsSync(path.join(projectPath, "docker-compose.yml"))) {
        techStack.otherTools.push("Docker");
    }

    // ✅ **Check for Tailwind CSS**
    if (fs.existsSync(path.join(projectPath, "tailwind.config.js"))) {
        techStack.otherTools.push("Tailwind CSS");
    }

    return techStack;
}
