#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#
#	The Original Code is the SLIME JDK interface.
#
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
#
#	Contributor(s):
#	END LICENSE

#	The following two lines are replaced by askpass.jsh.js when it customizes this script
#INVOKE_JSH=
#ASKPASS_JSH_PATH=
if [ -z "$INVOKE_JSH" ]; then
	SLIME=$(dirname $0)/../../..
	INVOKE_JSH="jrunscript $SLIME/rhino/jrunscript/api.js jsh"
fi
if [ -z "$ASKPASS_JSH_PATH" ]; then
	ASKPASS_JSH_PATH="$(dirname $0)/askpass.jsh.js"
fi
$INVOKE_JSH $ASKPASS_JSH_PATH -child -prompt "$@"
