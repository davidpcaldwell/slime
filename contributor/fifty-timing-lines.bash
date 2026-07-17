#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="${SCRIPT_DIR}/../local/jsh/lib/node"

if [[ -d "$NODE" ]]; then
	NODE="${NODE}/bin/node"
fi

if [[ ! -x "$NODE" ]]; then
	echo "Node executable not found or not executable: $NODE" >&2
	exit 1
fi

exec "$NODE" "${SCRIPT_DIR}/fifty-timing-lines.js" "$@"
