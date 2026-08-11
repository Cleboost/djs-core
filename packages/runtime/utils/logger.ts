import pc from "picocolors";

export type LogLevel = "debug" | "info" | "success" | "warn" | "error";
export type LogScope = "RUNTIME" | "DEV" | "PLUGIN";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	success: 1,
	warn: 2,
	error: 3,
};

const LEVEL_CONFIG: Record<
	LogLevel,
	{ icon: string; paint: (value: string) => string; method: "log" | "warn" | "error" }
> = {
	debug: { icon: "·", paint: pc.dim, method: "log" },
	info: { icon: "ℹ", paint: pc.cyan, method: "log" },
	success: { icon: "✓", paint: pc.green, method: "log" },
	warn: { icon: "⚠", paint: pc.yellow, method: "warn" },
	error: { icon: "✗", paint: pc.red, method: "error" },
};

const SCOPE_COLORS: Record<LogScope, (value: string) => string> = {
	RUNTIME: pc.magenta,
	DEV: pc.blue,
	PLUGIN: pc.yellow,
};

const colorsEnabled =
	process.env.NO_COLOR === undefined &&
	process.env.FORCE_COLOR !== "0" &&
	(process.stdout.isTTY ?? false);

function paint(scope: LogScope, value: string): string {
	if (!colorsEnabled) return value;
	return SCOPE_COLORS[scope](value);
}

function levelPaint(level: LogLevel, value: string): string {
	if (!colorsEnabled) return value;
	return LEVEL_CONFIG[level].paint(value);
}

function dim(value: string): string {
	if (!colorsEnabled) return value;
	return pc.dim(value);
}

function bold(value: string): string {
	if (!colorsEnabled) return value;
	return pc.bold(value);
}

function getMinLevel(): LogLevel {
	const raw = process.env.DJS_LOG_LEVEL?.toLowerCase();
	if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
		return raw;
	}
	return "info";
}

function formatTime(date = new Date()): string {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}

function formatScope(scope: LogScope, label?: string): string {
	const text = label ? `${scope}:${label}` : scope;
	return paint(scope, bold(`[${text}]`));
}

function write(
	level: LogLevel,
	scope: LogScope,
	label: string | undefined,
	message: string,
	extra?: unknown,
): void {
	if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[getMinLevel()]) {
		return;
	}

	const config = LEVEL_CONFIG[level];
	const prefix = `${dim(formatTime())} ${levelPaint(level, config.icon)} ${formatScope(scope, label)}`;
	const line = `${prefix} ${message}`;

	console[config.method](line);

	if (extra !== undefined) {
		console.error(extra);
	}
}

export interface Logger {
	debug(message: string): void;
	info(message: string): void;
	success(message: string): void;
	warn(message: string): void;
	error(message: string, error?: unknown): void;
	/** Multi-line warning with indented body and optional key/value rows. */
	warnBlock(options: {
		title: string;
		body?: string[];
		rows?: Array<{ label: string; value: string }>;
	}): void;
	/** Compact success summary with optional count chips on one indented line. */
	summary(options: {
		title: string;
		stats: Array<{ label: string; count: number }>;
	}): void;
	/** Print pre-formatted output without the logger prefix (banners, tables). */
	raw(message: string): void;
	child(name: string): Logger;
}

export function createLogger(scope: LogScope, label?: string): Logger {
	const emit = (
		level: LogLevel,
		message: string,
		extra?: unknown,
	): void => {
		write(level, scope, label, message, extra);
	};

	return {
		debug: (message) => emit("debug", message),
		info: (message) => emit("info", message),
		success: (message) => emit("success", message),
		warn: (message) => emit("warn", message),
		error: (message, error) => emit("error", message, error),
		warnBlock: ({ title, body = [], rows = [] }) => {
			emit("warn", title);

			const continuationIndent = " ".repeat(9);
			for (const line of body) {
				if (line.length === 0) {
					console.warn("");
					continue;
				}
				console.warn(`${continuationIndent}${dim(line)}`);
			}

			if (rows.length > 0 && body.length > 0) {
				console.warn("");
			}

			const labelWidth = rows.reduce(
				(max, row) => Math.max(max, row.label.length),
				0,
			);

			for (const row of rows) {
				const paddedLabel = row.label.padEnd(labelWidth, " ");
				console.warn(
					`${continuationIndent}${paint(scope, paddedLabel)} ${dim("→")} ${row.value}`,
				);
			}
		},
		summary: ({ title, stats }) => {
			emit("success", title);

			const visible = stats.filter((stat) => stat.count > 0);
			if (visible.length === 0) {
				return;
			}

			const continuationIndent = " ".repeat(9);
			const parts = visible.map(
				(stat) => `${dim(stat.label)} ${bold(String(stat.count))}`,
			);
			console.log(`${continuationIndent}${parts.join(dim(" · "))}`);
		},
		raw: (message) => {
			console.log(message);
		},
		child: (name) =>
			createLogger(scope, label ? `${label}:${name}` : name),
	};
}

export const runtimeLog = createLogger("RUNTIME");
export const devLog = createLogger("DEV");
export const pluginLog = (name: string) => createLogger("PLUGIN", name);
