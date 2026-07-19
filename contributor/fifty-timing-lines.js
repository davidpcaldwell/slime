#!/usr/bin/env node
//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
"use strict";

const globalObj = /** @type {any} */ (Function("return this")());
// @ts-ignore Node.js provides require in this runtime, but ambient types are not loaded in this tsconfig.
const nodeRequire = /** @type {(id: string) => any} */ (require);
// @ts-ignore Node.js provides process in this runtime, but ambient types are not loaded in this tsconfig.
const process = /** @type {{ argv: string[]; stdout: { write: (text: string) => void }; exit: (code: number) => never }} */ (globalObj.process);
const fs = nodeRequire("fs");
const path = nodeRequire("path");

/**
 * @typedef {{
 *   type: "node",
 *   name: string,
 *   runningLine: string,
 *   completionLine: string | null,
 *   completionStatus: "PASSED" | "FAILED" | null,
 *   durationMs: number | null,
 *   children: TreeNode[],
 *   included: boolean,
 *   selfIncluded: boolean
 * }} TreeNode
 */

function usage() {
	console.error("Usage: fifty-timing-lines [--threshold-seconds <number>] [--threshold-percentage <number>] [--stdout] <fifty-output-file> [timing-output-file]");
}

function parseArgs(argv) {
	/** @type {number | null} */
	let thresholdSeconds = null;
	/** @type {number | null} */
	let thresholdPercentage = null;
	let writeStdout = false;
	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--threshold-seconds") {
			if (i + 1 >= argv.length) throw new Error("Missing value for --threshold-seconds");
			const value = Number(argv[++i]);
			if (!isFinite(value) || value < 0) {
				throw new Error("--threshold-seconds must be a non-negative number");
			}
			thresholdSeconds = value;
		} else if (arg === "--threshold-percentage") {
			if (i + 1 >= argv.length) throw new Error("Missing value for --threshold-percentage");
			const value = Number(argv[++i]);
			if (!isFinite(value) || value < 0) {
				throw new Error("--threshold-percentage must be a non-negative number");
			}
			thresholdPercentage = value;
		} else if (arg === "--stdout") {
			writeStdout = true;
		} else {
			positional.push(arg);
		}
	}

	if (writeStdout) {
		if (positional.length !== 1 && positional.length !== 2) {
			throw new Error("When using --stdout, expected 1 or 2 positional arguments");
		}
	} else if (positional.length !== 2) {
		throw new Error("Expected exactly 2 positional arguments unless using --stdout");
	}

	return {
		thresholdSeconds,
		thresholdPercentage,
		inputFile: positional[0],
		outputFile: positional[1] || null,
		writeStdout
	};
}

function parseLastLineDurationMs(lines) {
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i].trim();
		if (!line) continue;
		const match = line.match(/\(([0-9]+) ms\)$/);
		if (match) return Number(match[1]);
		break;
	}
	return null;
}

function computeThresholdMs(parsed, totalMs) {
	/** @type {number[]} */
	const thresholds = [];

	if (parsed.thresholdSeconds !== null) {
		thresholds.push(parsed.thresholdSeconds * 1000);
	}

	if (parsed.thresholdPercentage !== null && totalMs !== null) {
		thresholds.push((parsed.thresholdPercentage / 100) * totalMs);
	}

	if (thresholds.length === 0) return 0;
	return Math.min(...thresholds);
}

/** @returns {TreeNode} */
function makeNode(name, runningLine) {
	return {
		type: /** @type {"node"} */ ("node"),
		name,
		runningLine,
		completionLine: null,
		completionStatus: null,
		durationMs: null,
		children: [],
		included: false,
		selfIncluded: false
	};
}

function sameNodeName(a, b) {
	return a.trim() === b.trim();
}

/**
 * Build a tree from interleaved "Running:" and timed completion lines.
 * Timed completion lines are either "PASSED: ... (N ms)" or "FAILED: ... (N ms)".
 * Other lines are ignored.
 */
function buildTree(lines) {
	/** @type {TreeNode} */
	const root = makeNode("<root>", "");
	/** @type {TreeNode[]} */
	const stack = [];

	for (const line of lines) {
		const running = line.match(/^([\t ]*)Running: (.*)$/);
		if (running) {
			const name = running[2];
			const parent = stack.length > 0 ? stack[stack.length - 1] : root;
			const node = makeNode(name, line);
			parent.children.push(node);
			stack.push(node);
			continue;
		}

		const completion = line.match(/^([\t ]*)(PASSED|FAILED): (.*) \(([0-9]+) ms\)$/);
		if (completion) {
			const status = completion[2];
			const name = completion[3];
			const durationMs = Number(completion[4]);

			let matchIndex = -1;
			for (let i = stack.length - 1; i >= 0; i--) {
				if (!sameNodeName(stack[i].name, name)) continue;
				matchIndex = i;
				break;
			}

			if (matchIndex !== -1) {
				const node = stack[matchIndex];
				node.completionLine = line;
				node.completionStatus = /** @type {"PASSED" | "FAILED"} */ (status);
				node.durationMs = durationMs;
				// This completion closes the matching node and any unclosed descendants.
				stack.length = matchIndex;
			}
		}
	}

	return root;
}

function markIncluded(node, thresholdMs) {
	let childIncluded = false;
	for (const child of node.children) {
		if (markIncluded(child, thresholdMs)) childIncluded = true;
	}

	const selfIncluded = node.durationMs !== null && node.durationMs >= thresholdMs;
	node.selfIncluded = selfIncluded;
	node.included = selfIncluded || childIncluded;
	return node.included;
}

function emit(node, outputLines) {
	for (const child of node.children) {
		if (!child.included) continue;
		const includedChildren = child.children.filter((c) => c.included);
		const hasTimedCompletion = child.completionLine !== null;

		const isLeaf = includedChildren.length === 0;
		if (isLeaf) {
			if (child.completionLine) outputLines.push(child.completionLine);
			continue;
		}

		// If a container has no timed completion, promote included children.
		if (hasTimedCompletion) {
			outputLines.push(child.runningLine);
		}
		emit(child, outputLines);
		if (hasTimedCompletion && child.completionLine) outputLines.push(child.completionLine);
	}
}

function main() {
	let parsed;
	try {
		parsed = parseArgs(process.argv.slice(2));
	} catch (e) {
		usage();
		console.error(String(e.message || e));
		process.exit(2);
	}

	if (!fs.existsSync(parsed.inputFile)) {
		console.error(`Input file not found: ${parsed.inputFile}`);
		process.exit(1);
	}

	const text = fs.readFileSync(parsed.inputFile, "utf8");
	const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
	const totalMs = parseLastLineDurationMs(lines);
	const thresholdMs = computeThresholdMs(parsed, totalMs);
	const root = buildTree(lines);
	markIncluded(root, thresholdMs);

	const outputLines = [];
	emit(root, outputLines);

	const output = outputLines.length ? `${outputLines.join("\n")}\n` : "";

	if (parsed.writeStdout) {
		process.stdout.write(output);
	}

	if (parsed.outputFile) {
		fs.mkdirSync(path.dirname(parsed.outputFile), { recursive: true });
		fs.writeFileSync(parsed.outputFile, output, "utf8");
	}
}

main();
