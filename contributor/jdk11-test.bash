#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME=$(dirname $0)/..
rm -R ${SLIME}/local/jdk/8
rm -R ${SLIME}/local/jdk/default
rm -R ${SLIME}/local/git
rm -R ${SLIME}/local/jsh
rm -R ${SLIME}/local/wiki
${SLIME}/jsh.bash --install-jdk-11
${SLIME}/jsh.bash ${SLIME}/jsh/test/jsh-data.jsh.js
