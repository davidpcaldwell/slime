#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

BASE=$(dirname $0)/../../../../..
rm -Rf ${BASE}/local/jsh/lib/node
"${BASE}/jsh.bash" "$(dirname $0)/node.jsh.js"
