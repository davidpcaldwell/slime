#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

HERE="$(dirname $0)"
SRC="${HERE}/../../../.."
env JSH_DEBUG_SCRIPT=rhino ${SRC}/jsh ${HERE}/tomcat.jsh.js
