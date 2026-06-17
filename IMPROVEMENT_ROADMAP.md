# 🛣️ djs-core — Improvement Roadmap

**Date** : 2026-06-16  
**Version actuelle** : 6.0.0  
**Scope** : 27 améliorations significatives identifiées lors d'un audit complet

---

## 📊 Vue d'ensemble

| Catégorie | Points | Priorité | Effort total |
|-----------|--------|----------|--------------|
| 🔴 Sécurité | 4 | P0 | ~30 min |
| 🟠 Duplication | 7 | P1 | ~5h |
| 🟡 Robustesse | 8 | P2 | ~2h |
| 🟢 Performance | 4 | P2 | ~2h |
| 🔵 Qualité | 4 | P3 | ~1h30 |

**Effort total estimé** : ~11h  
**Impact maximal focus** : Sécurité (#1) → Duplication (#5, #6) → Robustesse (#11, #13)

---

## 🔴 Sécurité — P0 (CRITIQUE)

### #1 — Injection de commande shell dans `plugin install`
**Fichier** : `packages/dev/commands/plugin.ts:119`  
**Niveau** : CRITIQUE  
**Effort** : 5 min

```ts
// ❌ ACTUEL
spawnSync("bun", ["add", fullName], { shell: true })

// ✅ FIX
spawnSync("bun", ["add", fullName])  // shell: true inutile avec tableau d'args
```

**Description**  
L'option `shell: true` + `fullName` dérivé d'un argument CLI permet une injection RCE :
```bash
djs-core plugin install '@djs-core/x && rm -rf ~'
```

**Impact** : Permet l'exécution de commandes arbitraires pendant l'installation de plugins.

---

### #2 — `shell: true` inutile dans plugin prisma
**Fichier** : `plugins/plugin-prisma-sqlite/index.ts:67, 75`  
**Niveau** : MINEUR (inoffensif ici, mais mauvaise pratique)  
**Effort** : 5 min

Les arguments sont fixes (`"prisma"`, `"generate"`), donc pas exploitable, mais à supprimer par cohérence avec le fix #1.

---

### #3 — SQL injection non documentée dans plugin-sql
**Fichier** : `plugins/plugin-sql/index.ts:19-28`  
**Niveau** : MOYEN  
**Effort** : 10 min

```ts
export const sqlPlugin = definePlugin({
  setup: (_client, config: SqlConfig) => {
    const db = new Database(config.path);
    return {
      // ⚠️ Protection repose ENTIÈREMENT sur l'usage des tagged templates
      execute: (strings: TemplateStringsArray, ...params: any[]) => {
        return db.query(strings.join("?")).all(...params);
      },
    };
  },
```

**Impact** : Un développeur écrivant `sql.execute(\`... ${userInput}\`)` au lieu de `` sql.execute`... ${userInput}` `` injecte du SQL.

**Fix** : Ajouter un JSDoc warning explicite + considérer une validation basique (forbid `SELECT *` en dev).

---

### #4 — Processus prisma fait `process.exit()` sans gestion d'erreur
**Fichier** : `plugins/plugin-prisma-sqlite/index.ts:69-84`  
**Niveau** : MINEUR  
**Effort** : 10 min

```ts
cli.command("prisma <action>", "Prisma helper commands")
  .action((action: string) => {
    if (action === "generate") {
      spawnSync("bunx", ["prisma", "generate"], { stdio: "inherit", shell: true });
      process.exit(0);  // ⚠️ Exit sans finalization
    }
    // ...
  });
```

**Impact** : Si un hook try-catch enveloppe l'appel CLI, le `process.exit()` tue le process quand même.

**Fix** : Retourner un code plutôt que d'appeler `process.exit()` directement.

---

## 🟠 Duplication — P1 (DETTE TECHNIQUE LOURDE)

### #5 — Duplication majeure des 7 classes d'interaction
**Fichier** : `packages/runtime/interaction/Button.ts`, `Modal.ts`, `StringSelectMenu.ts`, `UserSelectMenu.ts`, `RoleSelectMenu.ts`, `ChannelSelectMenu.ts`, `MentionableSelectMenu.ts`  
**Niveau** : MAJEUR  
**Effort** : ~2.5h

**Données**
- ~50 lignes répétées dans chacune des 7 classes
- **Total** : ~350 lignes dupliquées
- Modifications futures : doivent être synchronisées à 7 endroits

**Code dupliqué**
```ts
// Tous les 7 ont EXACTEMENT ceci :
private _run?: *RunFn<TData>;
private _baseCustomId?: string;
private _customId?: string;

override setCustomId(customId: string): this {
  this._baseCustomId = customId;
  this._customId = customId;
  super.setCustomId(customId);
  return this;
}

setData(data: TData extends undefined ? never : TData, ttl?: number): this {
  if (!this._baseCustomId) {
    throw new Error("...");
  }
  const token = storeInteractionDataHelper(data, ttl);
  const newCustomId = `${this._baseCustomId}:${token}`;
  this._customId = newCustomId;
  super.setCustomId(newCustomId);
  return this;
}

get customId(): string { /* idem */ }
get baseCustomId(): string { /* idem */ }
static decodeData(customId: string) { return decodeCustomIdHelper(customId); }
async execute(interaction, data?: unknown) { /* idem */ }
```

**Solution**  
Créer un mixin TypeScript ou une classe générique `BaseCustomIdInteraction<TData, TBuilder>` :

```ts
// packages/runtime/interaction/BaseCustomIdInteraction.ts
export abstract class BaseCustomIdInteraction<
  TData = undefined,
  TBuilder extends any = any,
> extends TBuilder {
  protected _run?: (interaction: any, data: TData) => unknown;
  protected _baseCustomId?: string;
  protected _customId?: string;

  // ... shared implementation ...

  abstract get _builderClass(): new () => TBuilder;
}

// Ensuite chaque classe devient 15 lignes :
export default class Button<TData = undefined> 
  extends BaseCustomIdInteraction<TData, ButtonBuilder> {
  // Juste les méthodes spécifiques (execute signature, error messages)
}
```

**Impact**
- -350 lignes
- +1 classe générique ~120 lignes
- **Net** : -230 lignes
- Synchronisation future : 1 seul endroit

---

### #6 — `compileRoot` et `compileCommands` dupliqués entre 2 handlers
**Fichier** : `packages/runtime/handler/CommandHandler.ts:243-334` ↔ `packages/runtime/handler/ApplicationCommandHandler.ts:125-229`  
**Niveau** : MAJEUR  
**Effort** : ~1.5h

**Données**
- CommandHandler : ~90 lignes
- ApplicationCommandHandler : ~100 lignes
- Logique identique, divergences subtiles

**Différences**
- ApplicationCommandHandler gère `applyDefaultContext()` et `copyOptionsToSubcommand()` (options Discord)
- CommandHandler pas d'options (simple route → command)

**Solution**  
Extraire une fonction générique `compileRootCommand(routes, getRootDescription)` dans `utils/compile-command.ts` :

```ts
// packages/runtime/utils/compile-command.ts
export function compileRootCommand(
  root: string,
  routes: Array<{ parts: string[], cmd: Command }>,
  getRootDescription: (root: string) => string | undefined,
  options?: {
    applyContext?: (target: Command | SlashCommandBuilder, routes) => void;
    copyOptions?: (cmd: Command, sc: SlashCommandSubcommandBuilder) => void;
  }
): ApplicationCommandDataResolvable | null {
  // Logique unifiée ici
}
```

**Impact**
- -90 lignes dans CommandHandler
- -50 lignes dans ApplicationCommandHandler
- **Net** : -140 lignes
- Logique testée en un seul endroit

---

### #7 — `resolvePlugin` ré-implémenté 4 fois
**Fichier** :  
- `packages/dev/utils/plugin.ts` (nouvellement créé)  
- `packages/runtime/DjsClient.ts:160-172`  
- `packages/dev/commands/plugin.ts:68-72`  
- `packages/dev/commands/start.ts` (indirectement via runBot → runPostinstall)  

**Niveau** : MINEUR  
**Effort** : 30 min

```ts
// ✅ Idée : placer resolvePlugin() dans @djs-core/runtime et l'importer partout
// packages/runtime/utils/plugin-resolver.ts
export async function resolvePlugin(pluginInput: unknown): Promise<ResolvedPlugin> {
  if (pluginInput instanceof Promise || (pluginInput && typeof pluginInput === "object" && "then" in pluginInput)) {
    const mod = await pluginInput;
    return Object.values(mod).find((v: any) => v && typeof v === "object" && "name" in v && "setup" in v);
  }
  return pluginInput;
}

// Ensuite importer depuis runtime dans DjsClient
```

**Impact**
- Cohérence
- Réduction de boilerplate
- **Net** : -40 lignes

---

### #8 — `buildRouteKey` et `buildAutocompleteRouteKey` identiques
**Fichier** : `packages/runtime/handler/CommandHandler.ts:361, 371`  
**Niveau** : MINEUR  
**Effort** : 5 min

```ts
// ❌ ACTUEL (dupliqué)
private buildRouteKey(interaction: ChatInputCommandInteraction): string { /* ... */ }
private buildAutocompleteRouteKey(interaction: AutocompleteInteraction): string { /* ... */ }

// ✅ FIX
private buildRouteKey(interaction: ChatInputCommandInteraction | AutocompleteInteraction): string {
  const root = interaction.commandName;
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand(false);
  if (group && sub) return `${root}.${group}.${sub}`;
  if (sub) return `${root}.${sub}`;
  return root;
}
```

---

### #9 — `ContextMenu.withType()` a 3 branches quasi-identiques
**Fichier** : `packages/runtime/interaction/ContextMenu.ts:24-94`  
**Niveau** : MINEUR  
**Effort** : 30 min

```ts
// ✅ Refactoriser
private cloneWithType(type: ContextMenuCommandType): ContextMenu {
  let data = null;
  if (this.name) {
    try { data = this.toJSON(); }
    catch { data = null; }
  }
  
  const newMenu = new ContextMenu();
  newMenu.setType(type);
  if (data?.name) newMenu.setName(data.name);
  if (data?.default_member_permissions) newMenu.setDefaultMemberPermissions(data.default_member_permissions);
  if (data?.dm_permission !== undefined) newMenu.setDMPermission(data.dm_permission);
  if (this._run) newMenu._run = this._run as any;
  return newMenu;
}

withType(type: ContextMenuCommandType) { return this.cloneWithType(type); }
```

---

### #10 — Pattern guilds/global répété dans 3 handlers
**Fichier** : `CommandHandler.ts`, `ContextMenuHandler.ts`, `ApplicationCommandHandler.ts`  
**Niveau** : MINEUR  
**Effort** : ~1h

```ts
// ✅ Extraire un helper
private async forEachScope(fn: (scope: string, isGlobal: boolean) => Promise<void>): Promise<void> {
  if (this.guilds.length > 0) {
    await Promise.all(this.guilds.map(guildId => fn(guildId, false)));
  } else {
    await fn("global", true);
  }
}

// Utilisation
await this.forEachScope(async (scope, isGlobal) => {
  await this.client.application.commands.delete(existingId, isGlobal ? undefined : scope);
});
```

---

## 🟡 Robustesse — P2

### #11 — Deux définitions divergentes de Config
**Fichier** : `packages/runtime/Plugin.ts:56` vs `packages/utils/types/config.d.ts:10`  
**Niveau** : MAJEUR (bug de types réel)  
**Effort** : 20 min

**Problème**
```ts
// Plugin.ts - CoreConfig
interface CoreConfig {
  token: string;
  servers: string[];
  intents?: /* ... */;
  commands?: { defaultContext?: /* ... */ };
  experimental?: { cron?: boolean; userConfig?: boolean };
  // ❌ MANQUENT : partials, experimental.bundle
}

// config.d.ts - Config
export interface Config {
  token: string;
  servers: string[];
  intents?: /* ... */;
  partials?: Partials[];  // ✅ Présent ici
  commands?: { /* ... */ };
  experimental?: { cron?: boolean; userConfig?: boolean; bundle?: boolean };  // ✅ bundle ici
}
```

**Conséquence**  
`defineConfig({ partials: [...] })` est rejeté par TypeScript alors que le runtime le supporte.

**Fix**  
Faire de `Config` la source de vérité et supprimer `CoreConfig`, ou synchroniser entièrement.

---

### #12 — Intents dupliqués dans les valeurs par défaut
**Fichier** : `packages/runtime/DjsClient.ts:65-66, 73-74`  
**Niveau** : MINEUR  
**Effort** : 5 min

```ts
intents: djsConfig.intents ?? [
  // ...
  IntentsBitField.Flags.GuildIntegrations,
  IntentsBitField.Flags.GuildIntegrations,  // ❌ Dupliqué
  // ...
  IntentsBitField.Flags.GuildScheduledEvents,
  IntentsBitField.Flags.GuildScheduledEvents,  // ❌ Dupliqué
  // ...
],
```

**Fix**  
Supprimer les doublons (pas d'effet sur discord.js, mais révèle un copier-coller non relu).

---

### #13 — `ephemeral: true` déprécié dans error.ts
**Fichier** : `packages/runtime/utils/error.ts:41, 47, 52`  
**Niveau** : MINEUR (warning de deprecation)  
**Effort** : 5 min

```ts
// ❌ ACTUEL (déprécié depuis discord.js 14.14)
await interaction.reply({ content, ephemeral: true });

// ✅ FIX (discord.js 14.25+)
await interaction.reply({ content, flags: MessageFlags.Ephemeral });
```

**Où c'est déjà correct** : ButtonHandler, SelectMenuHandler, ModalHandler, ContextMenuHandler utilisent tous `flags: MessageFlags.Ephemeral`.

---

### #14 — `getInteractionData` ne distingue pas "expiré" de "introuvable"
**Fichier** : `packages/runtime/store/DataStore.ts:87-108`  
**Niveau** : MOYEN  
**Effort** : 20 min

```ts
// ❌ ACTUEL
export function getInteractionData(token: string): unknown | undefined {
  const result = db.prepare("SELECT data, expires_at FROM interaction_data WHERE token = ?").get(token);
  if (!result) return undefined;  // Introuvable
  if (result.expires_at > 0 && result.expires_at < now) {
    deleteInteractionData(token);
    return undefined;  // Expiré
  }
  return JSON.parse(result.data);
}

// ✅ FIX
export function getInteractionData(token: string): { data: unknown; expired: boolean } | null {
  const result = db.prepare("SELECT data, expires_at FROM interaction_data WHERE token = ?").get(token);
  if (!result) return null;
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = result.expires_at > 0 && result.expires_at < now;
  
  if (isExpired) {
    deleteInteractionData(token);
    return { data: undefined, expired: true };
  }
  
  return { data: JSON.parse(result.data), expired: false };
}
```

**Impact** : Les handlers peuvent afficher des messages différents pour "this interaction has expired" vs "this interaction was not found".

---

### #15 — Token seulement 8 octets + INSERT OR REPLACE
**Fichier** : `packages/runtime/interaction/BaseInteraction.ts:12` / `packages/runtime/store/DataStore.ts:77`  
**Niveau** : MINEUR (statiquement peu probable)  
**Effort** : 5 min

```ts
// ❌ ACTUEL
const tokenBytes = randomBytes(8);  // 64 bits

// ✅ FIX
const tokenBytes = randomBytes(16);  // 128 bits
```

**Enjeu** : Avec 64 bits et `INSERT OR REPLACE`, une collision écrase silencieusement les données d'une autre interaction. Statiquement peu probable (~1 par billion interactions), mais possible. 128 bits = pratiquement impossible.

---

### #16 — `start.ts` ne gère que SIGINT, pas SIGTERM
**Fichier** : `packages/dev/commands/start.ts:13-17`  
**Niveau** : MOYEN  
**Effort** : 10 min

```ts
// ❌ ACTUEL
process.on("SIGINT", async () => {
  console.log(pc.dim("\nShutting down..."));
  await client.destroy();
  process.exit(0);
});
// SIGTERM (Docker, systemd) tue le process SANS cleanup

// ✅ FIX
const shutdown = async () => {
  console.log(pc.dim("\nShutting down..."));
  await client.destroy();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

**Impact** : Docker `stop` / systemd `stop` tue le bot sans fermer les connexions.

---

### #17 — Bug `-p, --path` aussi dans start.ts
**Fichier** : `packages/dev/commands/start.ts:8`  
**Niveau** : MINEUR  
**Effort** : 1 min

```ts
// ❌ ACTUEL
.option("-p, --path", "Custom project path", { default: "." })

// ✅ FIX
.option("-p, --path <path>", "Custom project path", { default: "." })
```

---

### #18 — `catch (_error) {}` silencieux masquant les erreurs
**Fichier** : `packages/dev/index.ts:53`, `packages/dev/commands/plugin.ts:83`, `packages/dev/commands/plugin.ts:178`  
**Niveau** : MOYEN  
**Effort** : 20 min

```ts
// ❌ ACTUEL
try {
  const configModule = await import(configPath);
  // ...
} catch (_error) {}  // Avale TOUT : erreur de typage, erreur du djs.config.ts, etc.

// ✅ FIX
try {
  const configModule = await import(configPath);
  // ...
} catch (error) {
  if (process.env.DEBUG) {
    console.error("[DEBUG] Failed to load config or plugins:", error);
  }
  // Continue silencieusement ou log un avertissement clair
}
```

**Impact** : Quand `djs.config.ts` échoue à charger (TOKEN missing, syntax error, etc.), aucun message n'aide l'utilisateur.

---

### #19 — `Route too deep` lève une exception non rattrapée
**Fichier** : `packages/runtime/handler/CommandHandler.ts:282`  
**Niveau** : MINEUR  
**Effort** : 15 min

```ts
// ❌ ACTUEL
if (parts.length === 3) { /* handle subcommand group */ }
throw new Error(`Route too deep: ${parts.join(".")}`);  // Message technique

// ✅ FIX
if (parts.length > 3) {
  throw new Error(
    `Route too deep: "${route}" has ${parts.length} levels (max 3: root.group.subcommand). ` +
    `Check your folder structure in src/interactions/commands.`
  );
}
```

---

## 🟢 Performance — P2

### #20 — DataStore ouvre la DB + lance setInterval dès l'import
**Fichier** : `packages/runtime/store/DataStore.ts:56, 135-138`  
**Niveau** : MOYEN  
**Effort** : 20 min

```ts
// ❌ ACTUEL
const dataStore = getDatabase();  // Exécuté à l'import du module

cleanupExpiredTokens();  // Immédiat
setInterval(() => {
  cleanupExpiredTokens();
}, 60 * 1000);  // Lance tout de suite, ne s'arrête jamais

// ✅ FIX (lazy init)
let dataStore: Database | null = null;
let cleanupIntervalId: NodeJS.Timeout | null = null;

function getOrInitDataStore(): Database {
  if (!dataStore) {
    dataStore = getDatabase();
    cleanupExpiredTokens();
    cleanupIntervalId = setInterval(() => {
      cleanupExpiredTokens();
    }, 60 * 1000);
  }
  return dataStore;
}

// Appeler `getOrInitDataStore()` au premier usage (dans storeInteractionData)
// Ajouter un cleanup method pour test/shutdown
```

**Impact**
- Évite l'allocation/interval si le bot n'utilise jamais les données d'interaction
- Permet un arrêt propre (appeler `clearInterval(cleanupIntervalId)` en shutdown)

---

### #21 — `router.find()` linéaire sur chaque interaction
**Fichier** : `packages/runtime/handler/CommandHandler.ts:72, 89`  
**Niveau** : MINEUR (impact réel seulement avec 1000+ commandes)  
**Effort** : 30 min

```ts
// ❌ ACTUEL
const route = this.router.find((r) => r.route === key);  // O(n)

// ✅ FIX
private routerMap: Map<string, Route> = new Map();

public async add(route: Route): Promise<void> {
  this.router.push(route);  // Garder pour l'order si besoin
  this.routerMap.set(route.route, route);  // Ajouter la Map
}

public async onCommandInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  const key = this.buildRouteKey(interaction);
  const route = this.routerMap.get(key);  // O(1)
  // ...
}
```

**Impact** : Négligeable avec <100 commandes, mais meilleure pratique de toute façon.

---

### #22 — `add()` une seule commande re-sync toute la racine
**Fichier** : `packages/runtime/handler/CommandHandler.ts:33-46`  
**Niveau** : MINEUR (ok en dev, mais inefficace)  
**Effort** : ~1h (refactor sync strategy)

```ts
// ❌ ACTUEL
public async add(route: Route, skipSync = false): Promise<void> {
  this.assertReady();
  const idx = this.router.findIndex((r) => r.route === route.route);
  if (idx >= 0) this.router[idx] = route;
  else this.router.push(route);
  this.enforceNoExecutableRootWhenHasChildren();
  
  if (!skipSync) {
    const root = getRoot(route.route);
    await this.upsertRootEverywhere(root);  // ⚠️ Recompile tout le groupe
  }
}

// ✅ FIX (optionnel, P3)
// Batching des sync : collecter les changements et debounc à 300ms
private syncQueue = new Set<string>();
private syncTimer: ReturnType<typeof setTimeout> | null = null;

private requestSync(root: string): void {
  this.syncQueue.add(root);
  if (this.syncTimer) clearTimeout(this.syncTimer);
  this.syncTimer = setTimeout(() => {
    for (const root of this.syncQueue) {
      await this.upsertRootEverywhere(root);
    }
    this.syncQueue.clear();
  }, 300);
}
```

**Impact** : Seulement visible avec 100+ hot reloads rapides.

---

### #23 — StringSelectMenu.addOptions clone à chaque appel
**Fichier** : `packages/runtime/interaction/StringSelectMenu.ts:78-92`  
**Niveau** : MINEUR  
**Effort** : 20 min

```ts
// ❌ ACTUEL
override addOptions(options: StringSelectMenuOption[]): this {
  const cloned = this.clone();  // Clone entier + Object.setPrototypeOf + Object.assign
  for (const option of options) {
    // ...
    super.addOptions.call(cloned, optionBuilder);
  }
  Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
  Object.assign(this, cloned);  // Réasigner tout
  return this;
}

// ✅ FIX (si possible)
override addOptions(options: StringSelectMenuOption[]): this {
  for (const option of options) {
    const optionBuilder = new StringSelectMenuOptionBuilder()
      .setLabel(option.label)
      .setValue(option.value);
    if (option.emoji) optionBuilder.setEmoji(option.emoji);
    super.addOptions(optionBuilder);  // Appeler super directement
  }
  return this;
}
```

**Raison du clone** : Possiblement contourner une limitation de `StringSelectMenuBuilder`, mais à clarifier.

---

## 🔵 Qualité — P3

### #24 — Code mort confirmé
**Fichier** : `packages/runtime/handler/CommandHandler.ts:220, 231`  
**Niveau** : MINEUR  
**Effort** : 5 min

```ts
// ❌ JAMAIS appelé
private refreshCacheFromSetResult(
  setResult: Collection<string, ApplicationCommand>,
  scope: string,
): void { /* ... */ }

private compileAllRoots(): ApplicationCommandDataResolvable[] { /* ... */ }
```

**Fix** : Supprimer (~25 lignes).

---

### #25 — 32 occurrences de `noExplicitAny`
**Fichier** : Partout dans `packages/` (prod code)  
**Niveau** : MINEUR  
**Effort** : ~2h (type inference pour plugins)

Concentrées sur :
- `DjsClient.initPlugins`
- `Plugin.ts` (inférence générique)
- `config-type-generator.ts` (plugin loading)
- `dev/commands/plugin.ts`

La plupart sont inévitables (chargement dynamique), mais le typage des extensions pourrait être affiné pour éviter les casts génériques.

**Fix** : Documenter les inévitables, affiner les autres. Pas une priorité.

---

### #26 — Bloc `catch` vide répété pour code 10063 (Unknown Interaction)
**Fichier** : `CommandHandler.ts:131-139`, `ApplicationCommandHandler.ts:83-90`, `ContextMenuHandler.ts` (absent), autres  
**Niveau** : MINEUR  
**Effort** : 20 min

```ts
// ❌ Répété ~5 fois
catch (error: unknown) {
  if (error && typeof error === "object" && "code" in error && error.code === 10063) {
    // Branche vide : on ne fait rien
  } else {
    throw error;
  }
}

// ✅ FIX
function isUnknownInteractionError(error: unknown): boolean {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: number }).code === 10063
  );
}

// Utilisation
catch (error: unknown) {
  if (!isUnknownInteractionError(error)) {
    throw error;
  }
  // Silently ignore 10063 (Unknown Interaction)
}
```

---

### #27 — Détection "bundled" fragile via Bun.main
**Fichier** : `packages/runtime/store/DataStore.ts:17`  
**Niveau** : MINEUR  
**Effort** : 15 min

```ts
// ❌ ACTUEL
const isBundled = Bun.main.endsWith("index.js") && dirname(Bun.main) === cwd;

// Impact : si compile à bot.exe ou autre nom, détection échoue → DB au mauvais endroit

// ✅ FIX (plus robuste)
const isBundled = process.env.BUN_COMPILE === "true" || 
                  Bun.main.endsWith("index.js") && dirname(Bun.main) === cwd;

// Ou accepter une var d'env explicite
const dbPath = process.env.DJ_SCORE_DB_PATH || 
               (isBundled ? join(cwd, "djscore.db") : join(cwd, ".djscore", "djscore.db"));
```

---

## 📋 Matrice de priorité et ordre de patch

### Phase 1 — P0 (Sécurité) — ~30 min
- [ ] #1 — Supprimer `shell: true` du plugin install
- [ ] #2 — Nettoyer prisma (cohérence)
- [ ] #3 — Documenter SQL injection risk
- [ ] #4 — Refactor exit() dans prisma CLI

### Phase 2 — P1 (Dette technique critique) — ~5h
- [ ] #5 — Extraire BaseCustomIdInteraction mixin (~2.5h)
- [ ] #6 — Unifier compileRoot (~1.5h)
- [ ] #7 — Centraliser resolvePlugin (~30 min)
- [ ] #8 — Fusionner buildRouteKey (~5 min)
- [ ] #9 — Refactor ContextMenu.withType (~30 min)
- [ ] #10 — Extraire forEachScope helper (~1h)

### Phase 3 — P2 (Robustesse & Perf) — ~4h
- [ ] #11 — Synchroniser Config/CoreConfig (~20 min)
- [ ] #12 — Retirer intents dupliqués (~5 min)
- [ ] #13 — Utiliser MessageFlags.Ephemeral (~5 min)
- [ ] #14 — Distinguer expired/notfound dans DataStore (~20 min)
- [ ] #15 — Passer à 16 octets de token (~5 min)
- [ ] #16 — Ajouter SIGTERM dans start.ts (~10 min)
- [ ] #17 — Fixer `-p, --path <path>` dans start.ts (~1 min)
- [ ] #18 — Ajouter debug logging sur catch (_error) (~20 min)
- [ ] #19 — Message d'erreur clair pour routes trop profondes (~15 min)
- [ ] #20 — Lazy-init DataStore + cleanup (~20 min)
- [ ] #21 — Ajouter Map pour O(1) routing (~30 min)
- [ ] #22 — Batching des sync (optionnel) (~1h)
- [ ] #23 — Clarifier/simplifier StringSelectMenu.addOptions (~20 min)

### Phase 4 — P3 (Qualité) — ~2h30
- [ ] #24 — Supprimer code mort (~5 min)
- [ ] #25 — Affiner typing noExplicitAny (doc) (~1h)
- [ ] #26 — Extraire isUnknownInteractionError (~20 min)
- [ ] #27 — Rendre DB path configurable (~15 min)

---

## 🎯 Recommandations pour merge

1. **Commencer par P0** : #1 est critique, les autres sont des nettoyages.
2. **Puis P1** : #5 et #6 sont les plus impactantes en maintenabilité.
3. **Puis P2 quick wins** : #11-14, #16-17 (peuvent se faire en 1-2 PR).
4. **Puis perf** : #20-21-22 si le projet a besoin de scale.
5. **P3 au fur et à mesure** : peuvent être intégrés aux autres PR.

**Effort total** : ~11 heures de développement + tests + review.

---

## 📝 Notes supplémentaires

- **Changeset nécessaire** : Tous les patches en P0-P1 méritent un minor/patch dans un changeset.
- **Breaking changes** : Aucun (tous les fix sont internes ou additionnels).
- **Tests** : Les points #5, #6, #20, #21 bénéficieraient de tests unitaires ajoutés.
- **Documentation** : #3 (SQL) et #27 (DB path) ont besoin de doc utilisateur.

---

**Dernière mise à jour** : 2026-06-16  
**Révisé par** : Audit automatique + analyse manuelle  
**Prochaine révision** : Après phase 2 complète
