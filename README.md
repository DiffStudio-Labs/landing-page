# DiffStudio Landing Page

A modern, responsive landing page for DiffStudio built with Tailwind CSS and React.

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## 🏃‍♂️ Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd landing-page
```

2. Initialize the project (if not already done):
```bash
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```

3. Install dependencies:
```bash
npm install
```

4. Start the development environment:

In terminal 1 - Start Tailwind compiler:
```bash
npx tailwindcss -i ./styles.css -o ./dist/output.css --watch
```

In terminal 2 - Install and start local server:
```bash
sudo npm install -g live-server  # Requires root privileges on Linux
live-server
```

> Note: On Linux, global npm installations require sudo privileges. Alternatively, you can configure npm to install global packages in your home directory without sudo. [Learn more](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

## 🚀 Build for Production

1. Build the CSS:
```bash
npx tailwindcss -i ./styles.css -o ./dist/output.css --minify
```

2. Deploy the following files:
- `index.html`
- `dist/output.css`
- `images/`

## 📄 License

All rights reserved © 2025 DiffStudio Labs LLC