# 📚 @djs-core/builder

<!-- ![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Cleboost/djs-core/test.yml?branch=master&style=flat-square) -->
<!-- ![NPM Downloads](https://img.shields.io/npm/d18m/djs-core?style=flat-square&link=https%3A%2F%2Fnpmjs.com%2Fpackage%2Fdjs-core) -->

Welcome to the **@djs-core/builder** library! 🎉

## Overview

This library is a part of the **djs-core** project, which aims to provide a modular and high-performance framework for building Discord bots using [Discord.js](https://discord.js.org/). 🤖

## Features

- 🚀 Builds quickly and efficiently
- 🔄 Supports hot-reloading for development
- 🔒 Supports code obfuscation to protect your source code
- 📁 Supports single file output
- 🐳 **NEW**: Docker containerization support for easy deployment

## Getting Started

To get started with **djs-core**, follow these steps:

In writing

### Docker Support

The builder now supports generating Docker files for easy containerization of your Discord bot. Simply enable the Docker option in your configuration:

```javascript
import bundleBot from '@djs-core/builder';

const stream = bundleBot({
  files: ['src/index.ts'],
  docker: true, // Enable Docker generation
  production: true
});
```

Or with custom Docker configuration:

```javascript
const stream = bundleBot({
  files: ['src/index.ts'],
  docker: {
    baseImage: 'node:18-alpine',
    port: 3000,
    compose: true,
    env: {
      NODE_ENV: 'production',
      BOT_TOKEN: '${BOT_TOKEN}'
    },
    packages: ['curl', 'git']
  },
  production: true
});
```

This will generate:
- `Dockerfile` - Optimized Docker image configuration
- `.dockerignore` - Files to exclude from Docker build
- `docker-compose.yml` - Docker Compose configuration for easy deployment
- `package.json` - Production dependencies file (if not present)

You can then build and run your bot with:
```bash
docker-compose up --build
```

## Contributing

We welcome contributions from the community! Feel free to open issues or submit pull requests. 🤝

## License

This project is licensed under the MIT License. 📄

## Contact

<!-- For any questions or support, please reach out to us at [discord](mailto:support@example.com). 📧 -->

Discord will be added soon.

Happy coding! 💻
