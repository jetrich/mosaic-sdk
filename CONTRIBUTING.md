# Contributing to MosAIc SDK

First off, thank you for considering contributing to MosAIc SDK! It's people like you that make MosAIc SDK such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by the [MosAIc SDK Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [jetrich@example.com].

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible.

**Note:** If you find a **Closed** issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue in the body of your new one.

#### How Do I Submit A Good Bug Report?

Bugs are tracked as GitHub issues. Create an issue and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible.
* **Provide specific examples to demonstrate the steps**. Include links to files or GitHub projects, or copy/pasteable snippets.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots and animated GIFs** if possible.
* **Include logs** from `.mosaic/logs/` directory if relevant.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Provide specific examples to demonstrate the steps**.
* **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
* **Explain why this enhancement would be useful** to most MosAIc SDK users.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

#### Pull Request Process

1. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
2. Update the CHANGELOG.md with your changes following the Keep a Changelog format.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent.
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Follow conventional commits specification:
  * `feat:` for new features
  * `fix:` for bug fixes
  * `docs:` for documentation only changes
  * `style:` for formatting, missing semi colons, etc
  * `refactor:` for code change that neither fixes a bug nor adds a feature
  * `perf:` for code change that improves performance
  * `test:` for adding missing tests or correcting existing tests
  * `build:` for changes that affect the build system
  * `ci:` for changes to CI configuration files and scripts
  * `chore:` for other changes that don't modify src or test files
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Development Setup

1. Clone the repository with submodules:
   ```bash
   git clone --recurse-submodules https://github.com/jetrich/mosaic-sdk.git
   cd mosaic-sdk
   ```

2. Install dependencies:
   ```bash
   npm run setup
   npm run install:all
   ```

3. Start the development environment:
   ```bash
   npm run dev:start
   ```

4. Make your changes in a new git branch:
   ```bash
   git checkout -b feat/my-feature-name
   ```

5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

### Working with Submodules

Each component (mosaic, mosaic-mcp, mosaic-dev, tony) is a git submodule. When making changes:

1. Navigate to the submodule directory
2. Create a new branch for your changes
3. Make your changes and commit them
4. Push to your fork of the submodule
5. Update the submodule reference in the main repository
6. Create pull requests for both the submodule and main repository

### Style Guide

#### JavaScript/TypeScript Style Guide

* Follow the TypeScript strict mode guidelines
* Use ESLint configuration provided in the project
* Prefer functional programming patterns where appropriate
* Use meaningful variable and function names
* Add JSDoc comments for public APIs

#### Documentation Style Guide

* Use Markdown for all documentation
* Include code examples where relevant
* Keep language clear and concise
* Update relevant documentation when changing functionality

## Community

* Join our Discord server (coming soon)
* Follow us on Twitter (coming soon)
* Read our blog (coming soon)

## Recognition

Contributors who submit accepted pull requests will be added to the AUTHORS file and recognized in our documentation.

Thank you for contributing to MosAIc SDK!