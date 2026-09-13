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

const text = fs.readFileSync(targetPath, 'utf8');
const target = JSON.parse(text);
if (target === null || Array.isArray(target) || typeof target !== 'object') {
	throw new Error(targetPath + ' must contain a JSON object at the top level.');
}

target['window.title'] = windowTitle;

fs.writeFileSync(targetPath, JSON.stringify(target, null, '\t') + '\n', 'utf8');
NODE
elif command -v python3 >/dev/null 2>&1; then
	python3 - "${TARGET_FILE}" "${WINDOW_TITLE}" <<'PY'
import json
import sys

target_path = sys.argv[1]
window_title = sys.argv[2]

with open(target_path, 'r', encoding='utf-8') as f:
	target = json.load(f)
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
