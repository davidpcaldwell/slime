#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

set -euo pipefail

OVERLAY_FILE="/slime/local/devcontainer/vscode-user-settings.overlay.json"
TARGET_FILE="/config/.vscode-server/data/Machine/settings.json"
MARKER_FILE="/config/.vscode-server/data/Machine/.slime-overlay-applied"

if [ ! -f "${OVERLAY_FILE}" ]; then
	exit 0
fi

mkdir -p "$(dirname "${TARGET_FILE}")"

if [ ! -f "${TARGET_FILE}" ]; then
	echo '{}' > "${TARGET_FILE}"
fi

node - <<'NODE'
const fs = require('fs');

const overlayPath = '/slime/local/devcontainer/vscode-user-settings.overlay.json';
const targetPath = '/config/.vscode-server/data/Machine/settings.json';

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

cp "${OVERLAY_FILE}" "${MARKER_FILE}"

echo "Applied personal VS Code remote settings overlay from ${OVERLAY_FILE}"
