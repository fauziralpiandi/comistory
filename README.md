# Comistory

> Every commit tells a story

A Lightweight CLI tool that transforms your Git commit history into an insightful, beautifully formatted report. Designed for developers and teams who want to create meaningful changelogs, release notes, and project documentation.

## Features

- 📋 Works with local Git repositories and remote GitHub repositories
- 🧩 Intelligently categorizes commits using conventional commit patterns
- 🚨 Automatically detects and highlights breaking changes
- 🔗 Creates links to commits and pull requests (when using GitHub)
- 📆 Groups commits by day for better chronological understanding
- 🎮 Simple command line interface with flexible options
- 🔒 Secure GitHub token management for API authentication
- 🌐 Support for multiple GitHub URL formats (HTTPS, SSH, shorthand)
- 📊 Organized, readable output format for better visualization
- 🛠️ Comprehensive handling and validation

## Installation

```sh
# Using pnpm
pnpm add -g comistory

# Using npm
npm install -g comistory

# Using yarn
yarn global add comistory
```

## Usage

- Generate a commit history report from a local Git repository:

  ```sh
  comistory generate --local
  ```

- Generate a commit history report from a remote GitHub repository:

  ```sh
  comistory generate --remote username/repository
  ```

  The following GitHub URL formats are supported:

  - HTTPS: `https://github.com/username/repository.git`
  - SSH: `github.com:username/repository.git`
  - Shorthand: `username/repository`

### Configuration

> [!NOTE]
>
> To use remote GitHub repositories, you'll need to configure your GitHub token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with the `repo` scope (for private repositories) or no scope (for public repositories)
3. Configure Comistory with the token:

   ```sh
   comistory config --set <YOUR_GITHUB_TOKEN>
   ```

   Check your token configuration status:

   ```sh
   comistory config --status
   ```

   To remove your GitHub token:

   ```sh
   comistory config --remove
   ```

### Advanced Options

| Option                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `--output <file>`     | Specify output file path (default: comistory.md)   |
| `--per-page <number>` | Number of commits per page `1-100`, default: `100` |
| `--page <number>`     | Page number to fetch, default: `1`                 |
| `--verbose`           | Enable verbose output for debugging                |

## Output

Comistory creates a structured markdown document that:

1. Groups commits by day (newest first)
2. Categorizes commits based on conventional commit types
3. For GitHub repositories, adds hyperlinks to:
   - Commit hashes (linking to the commit on GitHub)
   - Pull request numbers (linking to the PR on GitHub)

### Example Output

```md
# Comistory

> Every commit tells a story

## 2023/05/01

### ✨ Feature

- feat: add user authentication module ([abcd123](https://github.com/user/repo/commit/abcd123))
- feat: implement password reset flow ([ef56789](https://github.com/user/repo/commit/ef56789)) ([#42](https://github.com/user/repo/pull/42))

### 🐛 Bug Fix

- fix: resolve login page redirect issue ([98a7b65](https://github.com/user/repo/commit/98a7b65))

## 2023/04/30

### 🔥 Breaking Change

- feat!: completely redesign API response format ([d9fb543](https://github.com/user/repo/commit/d9fb543))

### 📚 Documentation

- docs: update installation instructions ([cc5d123](https://github.com/user/repo/commit/cc5d123))

### 🧪 Test

- test: add unit tests for auth module ([bb8f456](https://github.com/user/repo/commit/bb8f456))
```

## Development

### Setting Up the Development Environment

```sh
# Clone the repository
git clone https://github.com/fauziralpiandi/comistory.git
cd comistory

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run the CLI
node dist/index.js --help
```

### Project Structure

```
src/
├── commands/         # CLI command definitions
│   ├── config.ts     # Token configuration command
│   └── generate.ts   # Commit history generation command
├── models/           # Data models
│   └── commit.ts     # Commit interface definition
├── services/         # Core business logic
│   ├── formatters/   # Output formatting services
│   ├── git/          # Git provider implementations
│   └── token.ts      # Token management service
├── utils/            # Utility functions
└── index.ts          # Application entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request ✨

## License

This project is licensed under the [MIT License](LICENSE).

---

**Cheers!**
