export const eventTpl = (name: string, once = false): string => {
  const className = `${name.charAt(0).toUpperCase()}${name.slice(1)}Event`;
  return `import { BaseEvent } from \"djs-core\";

export default class ${className} extends BaseEvent {
  eventName = \"${name}\" as const;
  ${once ? "once = true;" : ""}

  async execute(client, ...args: any[]) {
    // TODO: implement the event logic
    console.log(\"${name} event triggered\", args);
  }
}
`;
}; 