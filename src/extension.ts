import * as vscode from 'vscode';
import * as dotenv from "dotenv";
import { scanProject } from './methods/scanProject';
import { SessionStore } from './methods/sessionStore';

dotenv.config({ path: __dirname + "/../.env" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('traycer.taskPlanner', () => {
    const panel = vscode.window.createWebviewPanel(
      "taskPlanner",
      "Traycer Task Planner",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
      async message => {
        if (message.command === "submitTask") {
          const taskPlan = await generateTaskPlan(message.task);
          panel.webview.postMessage({ command: "showPlan", plan: taskPlan });
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

// Function to generate the task plan using Gemini
async function generateTaskPlan(task: string): Promise<string> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Missing Gemini API Key. Please check your .env file.");
    }

    const session = SessionStore.getInstance();
    let techStack = session.getTechStack();
    const lastTask = session.getLastTask();
    const previousTask = lastTask ? lastTask.input : "NO previous task it is the first task";
    console.log("previous task is ", previousTask);

    if (!techStack) {
      console.log("First-time scan: Detecting project tech stack...");
      techStack = await scanProject();
      session.setTechStack(techStack);
    } else {
      console.log("Using cached tech stack.");
    }

    // Store user input task in session
    session.addTask(task, "");

    const techInfo = `
        **Detected Tech Stack:**
        - **Frameworks:** ${techStack.frameworks.length ? techStack.frameworks.join(", ") : "Unknown"}
        - **Databases:** ${techStack.databases.length ? techStack.databases.join(", ") : "None"}
        - **Other Tools:** ${techStack.otherTools.length ? techStack.otherTools.join(", ") : "None"}
        `;
    console.log(techInfo);

    const prompt = `
You are an **AI-powered software architect** generating **structured, step-by-step task plans** optimized for software development.
---

**📌 Previous Task in This Session:**  
${previousTask}  
**This helps maintain continuity if the current request is an extension of a prior task. if it is mention in user friendly way that 
it is the next part or continuation of last task and then proceed accordingly, if not then provide a fresh plan and proceed normally.
If previous task is unknown then don't mention it just proceed like a fresh task without mentioning.


### **📌 Task Analysis & Tech Stack Verification**
- **Task:** "${task}"
- **Detected Tech Stack:**  
${techInfo}

#### **Before Proceeding**:
1. **If the task is self-explanatory (e.g., "Build REST APIs")**, **immediately proceed**.
2. **If the task is ambiguous or highly specific (e.g., "Build REST APIs for a banking system")**, ask:
   - **"Is this a finance-related project? Do you require additional security measures like OAuth or PCI-DSS compliance?"**
   - **"Should the APIs support real-time communication (e.g., WebSockets, MQTT)?"**
   - **"Do you require a microservices architecture or a monolithic approach?"**
3. **If the tech stack is incomplete**, ask whether to use:
   - **Frontend:** React.js, Vue.js, Angular, etc.
   - **Backend:** Node.js (Express.js), Django, FastAPI, etc.
   - **Database:** MongoDB, PostgreSQL, MySQL, etc.
4. **If the tech stack is found then politely inform user that detected tech stack is this and plan will be based on detected tech and then ask 
     that if you want other tech please mention specific tech in task, and then proceed with detect tech and give a structured plan.
5. **Before proceeding analyze task silently if it needs total implementation like backend, frontend and all, if it is relavant then give
   a plan include all of these but if its just related to either frontend or backend then only give plan relavent to related tech ex:
   task is improve the ui of ... then its only related to frontend so in this case no need to give backend, only suggest the plan like how
   UI can be improved what user can use and always in the end ask as user friendly that if you need any step in detail, please ask for the step
   in detail.
6. **It might be possible that the task might be related to the previous asked task so if the new task seems relevant and connected then
provide the plan based on last response you can use our tasks stored in  sessionstore, only do this if its relevant and needed if not proceed normaly.

---

### **Dynamic Task Plan Generation**
- **Analyze the task category (Finance, Social Media, IoT, E-commerce, etc.)** and generate **relevant implementation details**.
- **Only generate relevant steps**—skip frontend if the task is backend-specific, and vice versa.
- **Ensure all responses use Markdown formatting** for **VS Code Webview compatibility**.

---

### **📌 Phase 1: Project Setup**
#### 🔹 Step 1: Install Required Dependencies

- **Backend:**  
\`\`\`sh
npm install express mongoose dotenv cors body-parser jsonwebtoken
\`\`\`

- **Frontend:**  
\`\`\`sh
npm install react react-dom react-router-dom axios tailwindcss
\`\`\`

---

### **📌 Phase 2: Backend Implementation**
#### 🔹 Step 2: Set Up REST API Routes  
- Follow **RESTful conventions** (GET /users, POST /users, etc.).
- Implement **authentication & authorization** if needed.

\`\`\`typescript
app.post('/api/login', (req, res) => {
  const token = jwt.sign({ userId: "12345" }, process.env.JWT_SECRET!);
  res.send({ token });
});
\`\`\`

---

### **📌 Phase 3: Frontend Implementation**
#### 🔹 Step 3: Consume API in React Frontend  
- Use axios to fetch data from API.

\`\`\`tsx
import axios from 'axios';
const response = await axios.get('/api/users');
\`\`\`

---

### **📌 Phase 4: Security & Performance**
#### 🔹 Step 4: Implement Security Best Practices
- **Sanitize user inputs** to prevent injection attacks.
- **Use HTTPS & secure authentication** (JWT, OAuth, etc.).

---

### **📌 Phase 5: Testing & Deployment**
#### 🔹 Step 5: Testing Strategy
- **Backend:** Jest + Supertest for API testing.
- **Frontend:** React Testing Library.

\`\`\`typescript
test('GET /api/users', async () => {
  const response = await request(app).get('/api/users');
  expect(response.status).toBe(200);
});
\`\`\`

#### 🔹 Step 6: Deployment Recommendations
1. **Docker-based Deployment (Default)**
\`\`\`dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
\`\`\`
2. **Serverless Deployment (If Cloud Detected)**
- **AWS Lambda**: Generate an serverless.yml config.
- **Google Cloud Functions**: Use gcloud deploy.

---

### **📌 Final Notes**
 Ensure **all responses follow structured task execution**.  
 **Provide additional context based on the task category** (e.g., Finance, IoT).  
 If frontend or backend involvement is unclear, **ask the user for clarification**.  
 Use **Markdown formatting** for **VS Code Webview compatibility**.

---
Now, generate the structured task plan!
`;




    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", result);
      throw new Error(`Gemini API Error: ${(result as any).error?.message || "Unknown error"}`);
    }

    const aiPlan = (result as any).candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";

    // Store AI response for future reference
    session.addTask(task, aiPlan);

    return `<h3>Task Plan for: ${task}</h3><p>${aiPlan.replace(/\n/g, "<br>")}</p>`;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return `<p style="color:red;">Error: Unable to generate task plan.</p>`;
  }
}

function getWebviewContent(): string {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Task Planner</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-white flex flex-col items-center p-6">
        
            <h2 class="text-3xl font-bold mb-4">Traycer Task Planner</h2>
            
            <textarea id="taskInput" class="w-full max-w-4xl h-24 p-3 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe your task..."></textarea>
            
            <button onclick="submitTask()" class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                Generate Plan
            </button>

            <h2 class="text-2xl font-semibold mt-6">Generated Task Plan</h2>
            <div id="output" class="w-full max-w-4xl bg-gray-800 p-4 mt-2 border border-gray-700 rounded-md min-h-[100px]"></div>

            <script>
                const vscode = acquireVsCodeApi();

                function submitTask() {
                    const task = document.getElementById('taskInput').value;
                    document.getElementById('output').innerHTML = "<p class='text-blue-400'>Generating plan...</p>";
                    vscode.postMessage({ command: 'submitTask', task });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'showPlan') {
                        document.getElementById('output').innerHTML = "<div class='whitespace-pre-line'>" + message.plan + "</div>";
                    }
                });
            </script>

        </body>
        </html>
    `;
}

// This method is called when your extension is deactivated
export function deactivate() { }
