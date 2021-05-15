#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

BASE=$(dirname $0)/../../../../..
rm ${BASE}/local/jsh/lib/js.jar
"${BASE}/jsh.bash" "$(dirname $0)/rhino.jsh.js"
