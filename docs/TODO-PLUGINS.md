# Brainstorming & Implémentation du Système de Plugins `djs-core`

## Objectif
Permettre aux utilisateurs d'étendre les fonctionnalités natives de `djs-core` via des packages NPM (ex: `@djs-core/prisma`, `@djs-core/sql`). Les plugins doivent pouvoir :
1. Être installés via NPM.
2. Recevoir une configuration typée depuis `djs.config.ts`.
3. Étendre l'instance `Client` avec une API propre (ex: `client.prisma`).
4. Générer des types globaux pour une DX parfaite.

## Architecture de la Solution ✅

### 1. Structure d'un Plugin (Package NPM) ✅
Un plugin est une définition qui lie un nom, un type de configuration et une instance. Implémenté via `definePlugin` dans `packages/runtime/Plugin.ts`.

### 2. Configuration dans `djs.config.ts` ✅
L'utilisateur enregistre le plugin et fournit sa configuration. `defineConfig` utilise des generics (`const P`) pour mapper la config au bon plugin sans élargissement de type.

### 3. Magie du Typage (Inférence vs Génération) ✅
- **Inférence :** `defineConfig` valide la configuration à l'écriture.
- **Génération :** `.djscore/plugins.d.ts` est généré pour injecter les types dans `discord.js`. Il utilise `(typeof import("../djs.config").default)["plugins"]` pour extraire les types d'extensions.

---

## Étapes d'Implémentation (TODO)

### Étape 1 : Définition des Types Core & Utility ✅
- [x] Créer `packages/runtime/Plugin.ts` avec l'interface `DjsPlugin` et un helper `definePlugin`.
- [x] Modifier `packages/utils/types/config.d.ts` pour supporter la structure `plugins` (liste) et `pluginsConfig` (objet mappé).

### Étape 2 : Amélioration de `defineConfig` ✅
- [x] Modifier `defineConfig` pour qu'il puisse inférer les types de `pluginsConfig` à partir du tableau `plugins`. Utilisation de `const P` pour préserver les types littéraux des noms de plugins.

### Étape 3 : Logique d'Injection au Runtime ✅
- [x] Dans `DjsClient.ts`, implémenter la résolution des plugins via `initPlugins()`.
- [x] Récupérer la config spécifique à chaque plugin depuis `djsConfig.pluginsConfig[plugin.name]`.
- [x] Appeler `setup()` et attacher le résultat au client.

### Étape 4 : Générateur de Types de Plugins ✅
- [x] Mettre à jour `packages/dev/utils/config-type-generator.ts` pour générer le fichier d'augmentation de `discord.js`.
- [x] Le fichier généré extrait dynamiquement les types d'extensions à partir de `djs.config.ts`.

### Étape 5 : Création d'un Plugin de Test (Simulant un package NPM) ✅
- [x] Créer un dossier `packages/plugin-demo`.
- [x] Implémenter un plugin qui ajoute une fonction simple au client (ex: `client.demo.hello()`).
- [x] Vérifier que `djs.config.ts` demande bien la config requise par ce plugin.
- [x] Vérifier que l'autocomplétion fonctionne dans une commande du bot (via `tsc --noEmit`).
