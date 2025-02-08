# Tracer Task Planner VSCode Extension

## 📌 Candidate Information
- **Name:** Praveen Kumar Patidar  
- **Email:** praveen_k@bt.iitr.ac.in or praveenpatidar171@gmail.com  
- **Tech Stack Used:** TypeScript, Node.js, Express.js, OpenAI Gemini API, VSCode API, Session Storage  

---

## 📌 How to Use
1. **Extract the folder** from the provided ZIP file.
2. **Open the folder** in VS Code.
3. **Install dependencies** by running:
   ```sh
   npm install
   ```
4. **Start development mode** by pressing:
   - `F5` (to open the VS Code development host).
5. **Run the extension** by pressing:
   - `Ctrl + Shift + P` to open the command palette.
   - Search for **Traycer: Generate Task Plan** and click on it.
6. **Start using the extension** to generate structured task plans!

---

## 📌 UI Overview
- **Input Box:** Users can type their task description.
- **Generate Plan Button:** Click this button to receive a structured response.
- **Output Section:** Displays the generated task plan based on user input.

---

## 📌 Approach
### **1️⃣ Tech Scanner**
- The scanner can read the codebase of the user and can detect the current tech stack automatically and provide the response based on detected tech.
- To ensure efficiency, we only read up to **15 lines** in files because most of the imports and exports can be found in these lines to avoid unnecessary response delays.

### **2️⃣ Dynamic Response Generation**
- We use **Gemini API** to generate detailed task plans.
- The response is structured dynamically, and we can modify the prompt in the future to refine results.

### **3️⃣ Session Handling For More Intelligence**
- The system scans the codebase of the user for **only on the first task** or after VS Code is reloaded because for the next tasks we already have stored previous tasks in session, so AI uses these tasks as context for next responses to improve accuracy.
- Previous tasks are stored, allowing AI to maintain context and save time for subsequent requests.
- Only a single session is stored for now, which can be reset on vs. code reload.

---

## 📌 Future Enhancements
- **Multi-session storage:** Currently, only a single session is maintained. We plan to allow session history storage.
- **More control over task structuring:** Users could configure templates for different types of task plans.
- **Improved UI/UX:** Adding features like task categorization, editing, and exporting task plans.
- **Alternative AI models:** Exploring OpenAI, Claude, or other LLMs for additional response variations.

---
**Thank you for reviewing my submission! Feel free to reach out if you have any questions or need modifications.** 