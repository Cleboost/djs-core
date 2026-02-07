# User Config Feature

This feature allows you to define custom configuration in a `config.json` file and access it with full TypeScript type safety through `client.conf`.

## Setup

### 1. Enable User Config

In your `djs.config.ts`, enable the experimental `userConfig` feature:

```typescript
import type { Config } from "@djs-core/dev";

export default {
  token: process.env.TOKEN,
  servers: ["your-server-id"],
  experimental: {
    userConfig: true, // Enable user config
  },
} satisfies Config;
```

### 2. Create config.json

Create a `config.json` file in your project root with your custom configuration:

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "mydb"
  },
  "features": {
    "premium": true,
    "maxUsers": 100
  },
  "apiKeys": ["key1", "key2"]
}
```

### 3. Generate TypeScript Types

Run the CLI command to generate TypeScript types from your `config.json`:

```bash
bun djs-core generate-config-types
# or with a custom path
bun djs-core generate-config-types -p ./path/to/your/bot
```

This will create a `config.types.ts` file with the inferred TypeScript types:

```typescript
// Auto-generated from config.json. Do not edit manually.

interface UserConfig {
  database: { host: string; port: number; name: string };
  features: { premium: boolean; maxUsers: number };
  apiKeys: string[];
}

export type { UserConfig };
```

### 4. Use the Config in Your Code

Access your config through `client.conf` with full type safety:

```typescript
import { EventListner } from "@djs-core/runtime";
import type { UserConfig } from "../config.types";
import { Events } from "discord.js";

export default new EventListner<UserConfig>()
  .event(Events.ClientReady)
  .run((client) => {
    // Access your config with full TypeScript autocomplete and type checking
    console.log(`Database: ${client.conf.database.host}:${client.conf.database.port}`);
    console.log(`Premium enabled: ${client.conf.features.premium}`);
    console.log(`Max users: ${client.conf.features.maxUsers}`);
    console.log(`API Keys: ${client.conf.apiKeys.length}`);
  });
```

## Notes

- The `config.json` file is loaded at runtime
- The `config.types.ts` file is auto-generated and should not be edited manually
- Re-run `generate-config-types` whenever you update your `config.json`
- The `client.conf` property is typed as `UserConfig` when using the generic type parameter
- If `userConfig` is not enabled, `client.conf` will be `undefined`

## Example Use Cases

- Database connection settings
- Feature flags
- API keys and credentials (ensure proper security measures)
- Custom bot configuration per environment
- Application-specific settings
