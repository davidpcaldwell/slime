#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

PARENT=$(dirname $0)
CODE="${PARENT}/.."
SLIME="${PARENT}/../../.."
${SLIME}/fifty test.browser ${CODE}/module.fifty.ts --chrome:data ${SLIME}/local/chrome/fifty "$@"
