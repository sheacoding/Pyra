# Contributing to Pyra

Thank you for your interest in contributing to Pyra! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [License Agreement](#license-agreement)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Pyra.git`
3. Add upstream remote: `git remote add upstream https://github.com/sheacoding/Pyra.git`
4. Install dependencies: `npm install`
5. Create a branch: `git checkout -b feature/your-feature-name`

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker
- Check if the issue already exists
- Provide detailed steps to reproduce
- Include system information (OS, Node.js version, etc.)

### Suggesting Features

- Open an issue with the `enhancement` label
- Clearly describe the feature and its benefits
- Discuss the implementation approach

### Submitting Pull Requests

1. Ensure your code follows the project's coding standards
2. Update documentation if needed
3. Add tests for new features
4. Ensure all tests pass: `npm run test` (if applicable)
5. Update CHANGELOG.md with your changes
6. Push to your fork and submit a pull request

## Development Workflow

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Run type checking
npx tsc --noEmit

# Run linting
npx eslint src/
```

### Project Structure

```
pyra/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── lib/               # TypeScript utilities
│   └── themes/            # Theme configurations
├── src-tauri/             # Rust backend
│   └── src/
│       ├── commands/      # Tauri command handlers
│       └── main.rs        # Entry point
└── docs/                  # Documentation
```

## Coding Standards

### TypeScript/React

- Use TypeScript strict mode
- Follow existing code style (2-space indentation)
- Use functional components with hooks
- Properly type all props and functions
- Use meaningful variable and function names

### Rust

- Follow Rust standard formatting (use `cargo fmt`)
- Write comprehensive error handling
- Document public APIs
- Use meaningful variable names

### General

- Write clear, self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Follow DRY (Don't Repeat Yourself) principle

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(editor): add syntax highlighting for Python
fix(console): resolve output streaming issue
docs(readme): update installation instructions
```

## License Agreement

### Contributor License Agreement (CLA)

By contributing to Pyra, you agree that:

1. **License Grant**: Your contributions will be licensed under the Apache License 2.0
2. **Original Work**: You certify that your contribution is your original work or you have the right to submit it
3. **Patent Grant**: You grant a patent license for your contributions as specified in Apache 2.0
4. **Commercial Use**: You understand that your contributions may be used in commercial contexts

### Copyright

All contributions must include proper copyright notices:

```typescript
/*
 * Copyright 2024 ericoding
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

For Rust files:

```rust
// Copyright 2024 ericoding
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
```

### Attribution

- Major contributors may be listed in the NOTICE file
- All contributors retain copyright to their contributions
- The project maintainer (ericoding) reserves the right to use contributions for commercial purposes as permitted by Apache 2.0

## Questions?

If you have questions about contributing, please:

- Check existing issues and discussions
- Open a new issue with the `question` label
- Contact the maintainer: **ericoding**

## Commercial Contributions

For commercial support, custom development, or partnership opportunities:

- Contact: **ericoding**
- We offer commercial licensing options for specific use cases
- Custom features and enterprise support available

Thank you for contributing to Pyra! 🎉
