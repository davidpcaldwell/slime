#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

#	Every SLIME devcontainer mounts its checkout at /slime, so windows are otherwise indistinguishable in the VS Code title bar.
#	This sets a Machine-scoped window.title that identifies the host checkout path; it runs before
#	apply-vscode-user-settings.bash so a personal overlay can still override window.title if desired.

set -euo pipefail

TARGET_FILE="/config/.vscode-server/data/Machine/settings.json"

if [ -z "${SLIME_HOST_PATH:-}" ]; then
	# SLIME_HOST_PATH is only injected when the container is created/recreated (it comes from .env via
	# docker-compose.extend.yaml). If it's missing here, the container needs to be rebuilt, not just restarted.
	echo "SLIME_HOST_PATH is not set; skipping window title (rebuild the devcontainer to pick up .env changes)." >&2
	exit 0
fi

mkdir -p "$(dirname "${TARGET_FILE}")"

if [ ! -f "${TARGET_FILE}" ]; then
	echo '{}' > "${TARGET_FILE}"
fi

WINDOW_TITLE="[${SLIME_HOST_PATH}] "'${dirty}${activeEditorShort}${separator}${rootName}${separator}${appName}'

if command -v node >/dev/null 2>&1; then
	node - "${TARGET_FILE}" "${WINDOW_TITLE}" <<'NODE'
const fs = require('fs');

const targetPath = process.argv[2];
const windowTitle = process.argv[3];

// VS Code settings files are JSONC: they may contain // and /* */ comments and trailing commas.
const parseJsonc = (text) => {
	let stripped = '';
	let inString = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inString) {
			stripped += c;
			if (c === '\\') { stripped += text[++i]; } else if (c === '"') { inString = false; }
			continue;
		}
		if (c === '"') { inString = true; stripped += c; }
		else if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; stripped += '\n'; }
		else if (c === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; }
		else { stripped += c; }
	}
	stripped = stripped.replace(/,(\s*[}\]])/g, '$1');
	return JSON.parse(stripped);
};

const text = fs.readFileSync(targetPath, 'utf8');
const target = parseJsonc(text);
if (target === null || Array.isArray(target) || typeof target !== 'object') {
	throw new Error(targetPath + ' must contain a JSON object at the top level.');
}

target['window.title'] = windowTitle;

fs.writeFileSync(targetPath, JSON.stringify(target, null, '\t') + '\n', 'utf8');
NODE
elif command -v python3 >/dev/null 2>&1; then
	python3 - "${TARGET_FILE}" "${WINDOW_TITLE}" <<'PY'
import json
import re
import sys

target_path = sys.argv[1]
window_title = sys.argv[2]

def parse_jsonc(text):
	# VS Code settings files are JSONC: they may contain // and /* */ comments and trailing commas.
	stripped = []
	in_string = False
	i = 0
	n = len(text)
	while i < n:
		c = text[i]
		if in_string:
			stripped.append(c)
			if c == '\\' and i + 1 < n:
				stripped.append(text[i + 1])
				i += 2
				continue
			if c == '"':
				in_string = False
			i += 1
			continue
		if c == '"':
			in_string = True
			stripped.append(c)
			i += 1
		elif c == '/' and i + 1 < n and text[i + 1] == '/':
			while i < n and text[i] != '\n':
				i += 1
			stripped.append('\n')
		elif c == '/' and i + 1 < n and text[i + 1] == '*':
			i += 2
			while i < n - 1 and not (text[i] == '*' and text[i + 1] == '/'):
				i += 1
			i += 2
		else:
			stripped.append(c)
			i += 1
	return json.loads(re.sub(r',(\s*[}\]])', r'\1', ''.join(stripped)))

with open(target_path, 'r', encoding='utf-8') as f:
	target = parse_jsonc(f.read())
if not isinstance(target, dict):
	raise ValueError(target_path + ' must contain a JSON object at the top level.')

target['window.title'] = window_title

with open(target_path, 'w', encoding='utf-8') as f:
	json.dump(target, f, indent=2)
	f.write('\n')
PY
else
	echo "apply-window-title.bash requires node or python3 to update ${TARGET_FILE}." >&2
	exit 1
fi
