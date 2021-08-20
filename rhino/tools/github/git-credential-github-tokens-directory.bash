#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

DIR="$(dirname $0)"
SLIME="${DIR}/../../.."

#	This credential helper does not store credentials; we assume the workflow is for these tokens to be obtained at github.com
#	and then pasted into a local file. Credential helpers earlier in the process should have no way of getting at these
#	credentials and providing them for this helper to store.

if [ "$1" == "store" ]; then
	exit 0
fi

${SLIME}/jsh.bash ${DIR}/git-credential-github-tokens-directory.jsh.js "$@"
