# @djs-core/plugin-prisma-sqlite

Ce plugin permet d'intégrer **Prisma 7** avec Bun en utilisant l'adaptateur natif SQLite de Bun (`bun:sqlite`), permettant ainsi de générer un bundle unique ("all-in-one") sans dépendance aux binaires Rust de Prisma.

## Installation

```bash
bun add @djs-core/plugin-prisma-sqlite
bun add @prisma/client prisma-adapter-bun-sqlite
bun add -d prisma
```

## Configuration du Schéma Prisma

Pour que le bundle soit complet et utilise le moteur client natif de Bun, votre fichier `prisma/schema.prisma` doit être configuré avec le nouveau générateur `prisma-client` :

```prisma
// prisma/schema.prisma
generator client {
  provider   = "prisma-client"
  engineType = "client"
  runtime    = "bun"
  // Optionnel: personnaliser l'output
  // output     = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// Vos modèles...
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
}
```

N'oubliez pas de générer votre client après chaque modification du schéma :

```bash
bunx prisma generate
```

## Utilisation

Ajoutez le plugin dans votre `djs.config.ts`. Pour conserver les types dynamiques de vos modèles, vous devez importer votre `PrismaClient` généré et le passer à `definePrismaPlugin` :

```typescript
// djs.config.ts
import { PrismaClient } from "./.djs-core/prisma"; // Votre client généré
import { definePrismaPlugin } from "@djs-core/plugin-prisma-sqlite";
import { defineConfig } from "@djs-core/runtime";

const prismaPlugin = definePrismaPlugin(PrismaClient);

const config = defineConfig({
  // ... vos autres configs
  plugins: [prismaPlugin],
  pluginsConfig: {
    prisma: {
      path: "dev.db", // Chemin vers votre fichier SQLite
    },
  },
});

export default config;
```

Le client Prisma sera alors accessible sur l'instance `client` de votre bot :

```typescript
// Dans une commande ou un événement
const userCount = await client.prisma.user.count();
```

## Pourquoi utiliser ce plugin ?

- **Bundling unique :** Permet d'utiliser `bun build --compile` pour créer un seul exécutable incluant tout le code et les requêtes à la base de données.
- **Performance :** Utilise `bun:sqlite` directement via l'adaptateur, offrant de meilleures performances que les adaptateurs standard.
- **Sans binaires Rust :** Supprime la dépendance aux fichiers binaires `query-engine` de Prisma.
