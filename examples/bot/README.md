# Playground djs-core

Ce dossier contient un petit bot Discord d’exemple pour tester **djs-core** pendant le développement.

## Pré-requis

1. Créez un bot sur le [portail développeur Discord](https://discord.com/developers/applications) et récupérez son **token**.
2. Ajoutez le bot à un serveur où vous avez les droits d’administration (notez son ID).
3. Dans ce dossier, copiez le fichier `env.template` en `.env` et renseignez le token.
4. Ouvrez `djsconfig.ts` et remplacez `YOUR_GUILD_ID_HERE` par l’ID du serveur :

```ts
export default {
  // …
  guildIds: ["123456789012345678"],
} as const;
```

## Lancer en mode dev

```bash
# Depuis la racine du repo
TOKEN=VotreToken bunx djs-core dev examples/playground
```

La commande `djs-core dev` :
1. Charge `djsconfig.ts` pour récupérer le token/intents.
2. Scanne automatiquement `src/commands`, `src/buttons`, etc.
3. Démarre un client Discord avec hot-reload.

Dans Discord, tapez `/ping` et le bot devrait répondre « Pong! 🏓 ».

> Remarque : ce playground n’est **pas** publié sur npm. Il sert uniquement à tester la librairie en local. 