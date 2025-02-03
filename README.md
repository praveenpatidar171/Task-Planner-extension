# 🛠️ Traycer Task Planner - VS Code Extension  

**AI-powered structured task planning inside VS Code**  

## 📖 Overview  
Traycer Task Planner is a **VS Code extension** that provides **structured, AI-generated task plans** for software development. It automatically detects the tech stack, suggests project phases, and outlines key considerations like security, testing, and deployment.  

---

## 🚀 Features  

✔ **AI-powered task planning** - Generates structured, step-by-step plans  
✔ **Tech stack detection** - Identifies project dependencies automatically  
✔ **Real-world considerations** - Covers security, performance, and deployment  
✔ **VS Code integration** - Works seamlessly within the IDE  

---

## 🛠 Installation & Setup  

### 1️⃣ **Clone the Repository**  
```sh
git clone https://github.com/praveenpatidar171/Task-Planner-extension.git
cd Task-Planner-extension
```

### 2️⃣ **Install Dependencies**  
```sh
npm install
```

### 3️⃣ **Compile TypeScript Code**  
Since this is a TypeScript-based VS Code extension, you need to compile it before running:  
```sh
npm run compile
```

### 4️⃣ **Run the Extension in VS Code**  
- Open VS Code  
- Press `F5` to start a **new Extension Development Host**  
- The extension will be available for testing in the new VS Code window  

---

## 🎯 **Usage**  

### **Triggering Task Planning**  
1. Open a project in VS Code  
2. Press **`Ctrl + Shift + P`** to open the **Command Palette**  
3. Type `Traycer: Generate Task Plan` and select it  
4. Enter a **high-level task description** (e.g., `Create a expense tracker application`)  
5. The extension will generate a detailed **step-by-step development plan**  


This will execute tests using **VS Code's testing framework**.  

---

## 📦 **Project Structure**  

```
traycer-task-planner/
├── src/
│   ├── extension.ts   # Main extension entry point
│   ├── methods        # Helper functions
├── out/               # Compiled TypeScript output
├── package.json       # Project dependencies & VS Code metadata
├── tsconfig.json      # TypeScript configuration
└── README.md          # Project documentation
```

---

## 🚀 **Future Enhancements**  

- **Customization Options**: Allow users to fine-tune task planning results  
- **More AI Integrations**: Support different LLMs for task generation  
- **User Preferences**: Save user-selected tech stacks for future queries  

---

## 🙌 **Acknowledgments**  

- Thanks to **Traycer AI** for the challenge prompt  
- Inspired by **GitHub Copilot Workspaces**  
- Built using **VS Code APIs, OpenAI, and TypeScript**  

---

### 🚀 **Now you’re ready to use the AI-powered Task Planner in VS Code!**  

