import * as vscode from 'vscode';
import * as dotenv from "dotenv";
import { scanProject } from './methods/scanProject';
dotenv.config({ path: __dirname + "/../.env" });


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('traycer.taskPlanner', () => {

		// Display a message box to the user
		const panel = vscode.window.createWebviewPanel(
			"taskPlanner",
			"Traycer Task Planner",
			vscode.ViewColumn.One,
			{ enableScripts: true }  // it will allow javascript execution
		);
		panel.webview.html = getWebviewContent();


		// Listen for messages from the Webview
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

// Function to generate the task plan by using GEMINI

async function generateTaskPlan(task: string): Promise<string> {
	try {
		// Ensure API key is available
		if (!GEMINI_API_KEY) {
			throw new Error("Missing Gemini API Key. Please check your .env file.");
		}

		// Scan the project to detect tech stack
		const techStack = scanProject();

		// Construct detected stack info
		const techInfo = `
		Detected Tech Stack:
		- **Frameworks:** ${techStack.frameworks.length > 0 ? techStack.frameworks.join(", ") : "Unknown"}
		- **Databases:** ${techStack.databases.length > 0 ? techStack.databases.join(", ") : "None"}
		- **Other Tools:** ${techStack.otherTools.length > 0 ? techStack.otherTools.join(", ") : "None"}
		`;
		console.log(techInfo);

		const prompt = `
						You are an AI assistant that generates **structured, step-by-step task plans** for software development.

						The user provided the task: "${task}". 

						- **Detected Tech Stack (from project dependencies):**  
						${techInfo}

						- **IMPORTANT:** The detected tech stack is based on available dependencies but may not capture the full setup.  
						If the project has a frontend (React, Next.js, Vue, etc.) or a backend (Express, Django, FastAPI, etc.), the user should confirm or specify their preference.
                        If any tech stack detected then mention it to user that i found this for frontend and this for backend and this for database
						. and then ask if he is okay with these techs or want to change and then proceed and if you found any tech stack always prefer that but first ask user that i will proceed with this tech unless user specify other tech.
						
						- **Frontend Consideration:**  
						If No frontend framework was detected. then ask politely Would you like to specify one? and gives options (Options: React.js, Vue.js, Angular, Svelte, etc.)  
					   and say If not specified, I will proceed with **React.js (functional components)**.

						- **Backend Consideration:**  
						If No backend framework was detected. then ask politely Would you like to specify one? and gives options (Options: Node.js with Express.js, Django, FastAPI, Go Fiber, etc.)  
						and say If not specified, I will proceed with **Node.js + Express.js + PostgreSQL**.

						- **Your Job:**  
						1. Generate a **structured, step-by-step task plan** based on the given task.  
						2. Each step should include:  
							- A **detailed explanation** of why the step is necessary.  
							- **Code snippets** where applicable (backend, database, frontend, API calls).  
							- **Alternatives** (e.g., different frameworks, database choices).  
						3. Provide **real-world considerations**, such as:  
							- Security best practices (input validation, authentication, error handling).  
							- Performance optimizations (caching, efficient database queries).  
							- Scalability concerns (API rate limiting, database indexing, load balancing).  
						4. **Frontend Enhancements (if applicable):**  
							- Include **UI component code based on the project type** (e.g., form components for CRUD apps, dashboard components for analytics apps).  
							- Show **how the frontend interacts with the backend** (API calls, state management).  
							- Explain **state management strategies** (e.g., React Context API, Redux, Zustand, Vuex).  
						5. **Testing Strategy:**  
							- Provide **testing recommendations for both backend and frontend**.  
							- Suggest tools like Jest, Supertest (backend) & React Testing Library, Cypress (frontend).  
							- Include **example test cases for API routes and UI components**.  
						6. **Deployment Steps:**  
							- Provide **step-by-step instructions** for deploying the backend (Heroku, AWS, Docker, etc.).  
							- Provide **step-by-step instructions** for deploying the frontend (Netlify, Vercel, etc.).  
							- Include **actual commands** to deploy the application.  

						 7. **Final Project Structure (if relevant to the task)**  
							- If appropriate for the task, **include a final file structure for the project**.  
							- The file structure should reflect best practices for organizing backend and frontend files.  
							- Only include this if it **adds value** to the task (e.g., a full-stack project or backend-heavy project).  

						If frontend or backend involvement is unclear, **politely ask the user to specify** before proceeding. 

						If the user does not specify a frontend or backend, **proceed with React.js (functional components) for frontend and Node.js + Express.js + PostgreSQL for backend**.
						 
					`;


		// Define the API endpoint
		const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

		// Define the request body
		const requestBody = {
			contents: [
				{
					parts: [
						{
							text: prompt
						}
					]
				}
			]
		};

		// Send request to Gemini API
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		const result = await response.json();

		// Check for API errors
		if (!response.ok) {
			console.error("Gemini API Error:", result);
			throw new Error(`Gemini API Error: ${(result as any).error.message || "Unknown error"}`);
		}

		// Extract and format the response
		const aiPlan = (result as any).candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI";
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
