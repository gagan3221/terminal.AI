# Terminal.AI

A modern, cross-platform terminal emulator built with Electron and TypeScript.

## Features

- 🖥️ Full-featured terminal emulator using xterm.js
- 🎨 Beautiful, modern UI with customizable theme
- ⚡ Fast and responsive
- 🔧 Built with TypeScript and Electron
- 🌈 Syntax highlighting and color support
- 📦 Cross-platform (macOS, Linux, Windows)

## Installation

```bash
npm install
```

After installation, the native dependencies will be automatically rebuilt for Electron.

## Usage

### Development Mode

Start the application in development mode with auto-reload:

```bash
npm run dev
```

### Production Mode

Build and start the application:

```bash
npm start
```

### Build Only

Compile TypeScript files:

```bash
npm run build
```

### Rebuild Native Dependencies

If you encounter issues with native modules:

```bash
npm run rebuild
```

## Project Structure

```
terminal.ai/
├── src/
│   ├── main.ts       # Main Electron process
│   ├── preload.ts    # Preload script for IPC
│   └── types.d.ts    # TypeScript type definitions
├── dist/             # Compiled JavaScript files
├── index.html        # Terminal UI
├── package.json
└── tsconfig.json
```

## How It Works

1. **Main Process** (`main.ts`): Creates the Electron window and spawns a pseudo-terminal (PTY) using `node-pty`
2. **Renderer Process** (`index.html`): Displays the terminal UI using `xterm.js`
3. **IPC Communication** (`preload.ts`): Bridges the main and renderer processes securely

The terminal uses:
- **node-pty**: Creates a real shell process (bash/zsh on Unix, PowerShell on Windows)
- **xterm.js**: Renders the terminal UI with full ANSI color support
- **Electron IPC**: Handles communication between the terminal UI and shell process

## Terminal Features

- Command history
- Text selection and copy/paste
- Color themes
- Proper cursor handling
- Auto-resize on window change
- Full ANSI escape code support

## Troubleshooting

### Native Module Issues

If you see errors related to `node-pty`, rebuild it for Electron:

```bash
npm run rebuild
```

### Terminal Not Working

Make sure you have the proper shell installed:
- **macOS/Linux**: bash or zsh (default)
- **Windows**: PowerShell

## Technologies Used

- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [xterm.js](https://xtermjs.org/) - Terminal emulator for the web
- [node-pty](https://github.com/microsoft/node-pty) - Pseudo-terminal interface

## License

ISC
