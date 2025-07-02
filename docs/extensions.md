# Extension System

The djs-core extension system allows you to extend the framework with custom functionality through a three-part architecture.

## Extension Architecture

Extensions consist of three parts:

1. **Development code** (`dev.ts`) - Handles hot reload functionality during development
2. **Build code** (`build.ts`) - Interacts with the build system to manipulate files and configuration
3. **Runtime code** (`runtime.ts`) - Gets bundled and runs in production mode

## Extension Manifest

Each extension requires a `manifest.json` file with the following structure:

```json
{
  "name": "extension-name",
  "version": "1.0.0",
  "author": "Author Name",
  "packageId": "unique-package-id",
  "description": "Extension description",
  "incompatible": ["other-extension-id"],
  "djsCoreVersion": "^4.0.0",
  "dependencies": {
    "some-package": "^1.0.0"
  }
}
```

### Required Fields
- `name`: Human-readable extension name
- `version`: Semantic version of the extension
- `author`: Extension author
- `packageId`: Unique identifier for the extension

### Optional Fields
- `description`: Extension description
- `incompatible`: Array of package IDs that are incompatible with this extension
- `djsCoreVersion`: Required djs-core version (semver range)
- `dependencies`: Extension dependencies

## CLI Commands

### Create Extension
```bash
djs-core extension create <name> [options]
```

Options:
- `--author <author>`: Extension author
- `--description <description>`: Extension description

### List Extensions
```bash
djs-core extension list
```

### Validate Extensions
```bash
djs-core extension validate
```

## Extension Development

### Development Code (`dev.ts`)

```typescript
import { ExtensionDev } from "djs-core";

export default class MyExtensionDev extends ExtensionDev {
  manifest = {
    name: "my-extension",
    version: "1.0.0",
    author: "Me",
    packageId: "my-extension"
  };

  async onLoad(): Promise<void> {
    console.log("Extension loaded in development mode");
    // Add your development logic here
  }

  async onUnload(): Promise<void> {
    console.log("Extension unloaded from development mode");
    // Clean up development resources here
  }

  async onReload(): Promise<void> {
    console.log("Extension reloaded in development mode");
    // Handle hot reload logic here
  }
}
```

### Build Code (`build.ts`)

```typescript
import { ExtensionBuild } from "djs-core";

export default class MyExtensionBuild extends ExtensionBuild {
  manifest = {
    name: "my-extension",
    version: "1.0.0",
    author: "Me",
    packageId: "my-extension"
  };

  async onPreBuild(config: unknown): Promise<void> {
    console.log("Extension pre-build hook");
    // Add your pre-build logic here
  }

  async onPostBuild(config: unknown): Promise<void> {
    console.log("Extension post-build hook");
    // Add your post-build logic here
  }

  async onAddFiles(): Promise<string[]> {
    // Return array of additional files to include in build
    return ["path/to/additional/file.js"];
  }
}
```

### Runtime Code (`runtime.ts`)

```typescript
import { ExtensionRuntime } from "djs-core";

export default class MyExtensionRuntime extends ExtensionRuntime {
  manifest = {
    name: "my-extension",
    version: "1.0.0",
    author: "Me",
    packageId: "my-extension"
  };

  async onInit(): Promise<void> {
    console.log("Extension initialized at runtime");
    // Add your runtime logic here
  }

  async onShutdown(): Promise<void> {
    console.log("Extension shutting down");
    // Clean up runtime resources here
  }
}
```

## Extension Directory Structure

```
extensions/
├── my-extension/
│   ├── manifest.json
│   ├── dev.ts
│   ├── build.ts
│   └── runtime.ts
└── another-extension/
    ├── manifest.json
    ├── dev.ts
    ├── build.ts
    └── runtime.ts
```

## Hot Reload Support

In development mode, extensions support hot reloading:

1. File changes in the `extensions/` directory are automatically detected
2. The extension's `onReload()` method is called
3. Extension state can be preserved or reset as needed

## Build Integration

Extensions can interact with the build process:

1. **Pre-build hooks**: Modify configuration before building
2. **Post-build hooks**: Process files after building
3. **File addition**: Add additional files to the build output
4. **Transform hooks**: Transform file contents during build (planned)

## Best Practices

1. Use unique package IDs to avoid conflicts
2. Specify version ranges for dependencies
3. Handle errors gracefully in all hooks
4. Clean up resources properly in shutdown hooks
5. Use semantic versioning for extension versions
6. Document incompatibilities clearly

## Example Use Cases

- **Database integrations**: Add database connectivity and ORM features
- **Authentication systems**: Implement custom authentication flows
- **API integrations**: Connect to external services
- **Custom commands**: Add domain-specific bot commands
- **Middleware**: Add request/response processing
- **Logging extensions**: Custom logging and monitoring
- **Development tools**: Add debugging and profiling capabilities