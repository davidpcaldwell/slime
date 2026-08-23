#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

set -euo pipefail

TARGET_FILE="/config/.vscode-server/data/Machine/settings.json"
MARKER_FILE="/config/.vscode-server/data/Machine/.slime-overlay-applied"

OVERLAY_FILE=""
for candidate in \
	"/config/.devcontainer/vscode-user-settings.overlay.json"
do
	if [ -f "${candidate}" ]; then
		OVERLAY_FILE="${candidate}"
		break
	fi
done

if [ -z "${OVERLAY_FILE}" ]; then
	exit 0
fi

mkdir -p "$(dirname "${TARGET_FILE}")"

if [ ! -f "${TARGET_FILE}" ]; then
	echo '{}' > "${TARGET_FILE}"
fi

if command -v node >/dev/null 2>&1; then
	node - "${OVERLAY_FILE}" "${TARGET_FILE}" <<'NODE'
const fs = require('fs');

const overlayPath = process.argv[2];
const targetPath = process.argv[3];

const readJson = (path) => {
	const text = fs.readFileSync(path, 'utf8');
	const value = JSON.parse(text);
	if (value === null || Array.isArray(value) || typeof value !== 'object') {
		throw new Error(path + ' must contain a JSON object at the top level.');
	}
	return value;
};

const overlay = readJson(overlayPath);
const target = readJson(targetPath);

for (const [key, value] of Object.entries(overlay)) {
	target[key] = value;
}

fs.writeFileSync(targetPath, JSON.stringify(target, null, '\t') + '\n', 'utf8');
NODE
elif command -v python3 >/dev/null 2>&1; then
	python3 - "${OVERLAY_FILE}" "${TARGET_FILE}" <<'PY'
import json
import sys

overlay_path = sys.argv[1]
target_path = sys.argv[2]

def read_json(path):
	with open(path, 'r', encoding='utf-8') as f:
		value = json.load(f)
	if not isinstance(value, dict):
		raise ValueError(path + ' must contain a JSON object at the top level.')
	return value

overlay = read_json(overlay_path)
target = read_json(target_path)
target.update(overlay)

with open(target_path, 'w', encoding='utf-8') as f:
	json.dump(target, f, indent=2)
	f.write('\n')
PY
else
	echo "No node or python3 runtime available to apply settings overlay." >&2
	exit 1
fi

cp "${OVERLAY_FILE}" "${MARKER_FILE}"

echo "Applied personal VS Code remote settings overlay from ${OVERLAY_FILE}"
