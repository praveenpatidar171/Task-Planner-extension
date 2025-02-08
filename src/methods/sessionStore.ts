export class SessionStore {
    private static instance: SessionStore;
    private sessionData: {
        tasks: { input: string; response: string }[];
        techStack: { frameworks: string[]; databases: string[]; otherTools: string[] } | null;
    };

    private constructor() {
        this.sessionData = { tasks: [], techStack: null };
    }

    // Get singleton instance with error handling
    public static getInstance(): SessionStore {
        if (!SessionStore.instance) {
            try {
                console.log("[SessionStore] Initializing new instance.");
                SessionStore.instance = new SessionStore();
            } catch (error) {
                console.error("[SessionStore] Error during initialization:", error);
                throw new Error("Failed to initialize session store.");
            }
        }
        return SessionStore.instance;
    }

    // Store tech stack only if changed, ensuring no duplicates
    public setTechStack(techStack: { frameworks: string[]; databases: string[]; otherTools: string[] }): void {
        const uniqueTechStack = {
            frameworks: Array.from(new Set(techStack.frameworks)),
            databases: Array.from(new Set(techStack.databases)),
            otherTools: Array.from(new Set(techStack.otherTools)),
        };

        if (this.sessionData.techStack &&
            JSON.stringify(this.sessionData.techStack) === JSON.stringify(uniqueTechStack)) {
            console.log("[SessionStore] Tech stack unchanged. Skipping update.");
            return;
        }

        console.log("[SessionStore] Updating stored tech stack:", uniqueTechStack);
        this.sessionData.techStack = uniqueTechStack;
    }

    public getTechStack(): { frameworks: string[]; databases: string[]; otherTools: string[] } | null {
        return this.sessionData.techStack;
    }

    // Store user task and AI response (limit to last 10 tasks)
    public addTask(input: string, response: string): void {
        console.log(`[SessionStore] Adding new task: "${input}"`);
        this.sessionData.tasks.push({ input, response });

        // Keep only the last 10 tasks to avoid memory bloat
        if (this.sessionData.tasks.length > 10) {
            this.sessionData.tasks.shift();
        }
    }

    public getLastTask(): { input: string; response: string } | null {
        return this.sessionData.tasks.length > 0 ? this.sessionData.tasks[this.sessionData.tasks.length - 1] : null;
    }

    public getAllTasks(): { input: string; response: string }[] {
        return [...this.sessionData.tasks]; // Return a copy to avoid accidental mutations
    }

    // Reset session data (useful for debugging)
    public resetSession(): void {
        console.log("[SessionStore] Resetting entire session data.");
        this.sessionData = { tasks: [], techStack: null };
    }

    // New: Clear only tasks without affecting tech stack
    public clearTasks(): void {
        console.log("[SessionStore] Clearing task history.");
        this.sessionData.tasks = [];
    }
}
