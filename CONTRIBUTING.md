# Contributing to vmetrics-js

First off, thank you for considering contributing to vmetrics-js! It's people like you that make this library better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, logs, etc.)
- **Describe the behavior you observed** and what you expected
- **Include your environment details**: Node.js version, OS, vmetrics-js version

Example bug report:

```markdown
## Bug: Flush fails silently with invalid URL

**Steps to reproduce:**

1. Create client with URL `http://invalid-host:9999`
2. Write data points
3. Call flush()

**Expected:** Error should be thrown or logged
**Actual:** No error, data is lost

**Environment:**

- Node.js: v20.10.0
- vmetrics-js: 0.0.1
- OS: Ubuntu 22.04
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear use case**: Why is this enhancement needed?
- **Detailed description**: How should it work?
- **Examples**: Code samples showing the proposed API
- **Alternatives considered**: Other approaches you've thought about

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Add tests** for any new functionality
4. **Update documentation** (README.md, JSDoc comments, etc.)
5. **Run the test suite** to ensure everything passes
6. **Format your code** using Prettier
7. **Create a pull request** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/vmetrics-js.git
cd vmetrics-js

# Install dependencies
npm install

# Run tests in watch mode
npm test

# Build the project
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Run example
npm run example
```

## Coding Guidelines

### TypeScript Style

- Use TypeScript for all code
- Enable strict mode (already configured)
- Prefer interfaces over types for public APIs
- Document all public APIs with JSDoc comments

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint      # Check for linting errors
npm run format    # Auto-format code
```

**Key conventions:**

- Use meaningful variable names
- Keep functions small and focused
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Add comments for complex logic

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names

Example test:

```typescript
import { VictoriaMetricsClient } from './client.js'
import { describe, it, expect } from 'vitest'

describe('VictoriaMetricsClient', () => {
    it('should buffer points before flushing', () => {
        const client = new VictoriaMetricsClient({
            url: 'http://0.0.0.0:8428',
            batchSize: 100,
        })

        client.writePoint({
            measurement: 'test',
            tags: { tag1: 'value1' },
            fields: { field1: 1 },
        })

        expect(client['buffer']).toHaveLength(1)
    })
})
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**

```
feat: add compression support for batch sending

Implements gzip compression for HTTP requests to reduce
bandwidth usage when sending large batches.

Closes #42
```

```
fix: prevent buffer overflow when batch size is exceeded

The buffer could grow unbounded if flush operations failed
repeatedly. Now we limit buffer size to 10x batchSize.
```

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for all public APIs
- Include code examples in documentation
- Update CHANGELOG.md following Keep a Changelog format

### Performance Considerations

- Avoid unnecessary allocations in hot paths
- Use buffer pooling for large batches
- Benchmark performance-critical changes
- Document any performance trade-offs

## Project Structure

```
vmetrics-js/
├── src/
│   ├── index.ts         # Main entry point (exports)
│   ├── client.ts        # VictoriaMetricsClient implementation
│   ├── types.ts         # Type definitions
│   └── client.spec.ts   # Tests
├── example/
│   └── simple-example.ts
├── dist/                # Build output (git-ignored)
└── ...config files
```

## Testing Locally with VictoriaMetrics

For integration testing, run VictoriaMetrics locally:

```bash
docker run -d --name victoriametrics \
  -p 8428:8428 \
  victoriametrics/victoria-metrics:latest
```

Then run the example:

```bash
npm run example
```

Query the data:

```bash
curl 'http://0.0.0.0:8428/api/v1/query?query=iot_example'
```

## Release Process

(For maintainers)

1. Update CHANGELOG.md
2. Bump version in package.json
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will automatically publish to npm

## Questions?

Feel free to open an issue for questions or start a discussion. We're here to help!

## Recognition

Contributors will be recognized in the README and release notes. Thank you for making vmetrics-js better!

---

Happy coding!
