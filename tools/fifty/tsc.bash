#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

DIR="$(dirname $0)"
SLIME="${DIR}/../../../.."
: "${PROJECT:=${SLIME}}"
export PROJECT
env PATH="${PATH}:${SLIME}/local/jsh/lib/node/bin" NODE_PATH="${SLIME}/local/jsh/lib/node/lib/node_modules" node ${NODE_DEBUG} ${DIR}/tsc.node.js "$@"
