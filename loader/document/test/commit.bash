#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME=$(dirname $0)/../../..
SRC=$(dirname $0)/..
"${SLIME}/fifty" test.jsh "${SRC}/module.fifty.ts" && "${SLIME}/fifty" test.browser "${SRC}/module.fifty.ts" && ${SLIME}/wf commit --notest "$@"
