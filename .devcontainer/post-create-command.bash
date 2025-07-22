#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME=$(dirname $0)/..

${SLIME}/jsh --add-jdk-8
${SLIME}/jsh --add-jdk-11
${SLIME}/jsh --add-jdk-17
${SLIME}/jsh --add-jdk-21
