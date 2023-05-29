#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME="$(dirname $0)/../../../.."
export LOGS="${SLIME}/local/test/jsh/launcher/suite-under-jdk-11"
export RHINO="mozilla/1.7.12"
$(dirname $0)/suite-with-clean-jdk-install.bash --install-jdk-11
