//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$api.script.resolve("../../jsh/launcher/slime.js").load();

if (false) {
} else if ($api.arguments[0] == "jdwp" || $api.arguments[0] == "xjdwp") {
	if ($api.arguments[0] == "jdwp") {
		Packages.java.lang.System.setProperty("jsh.debug.jdwp", new Packages.java.lang.String($api.arguments[1]))
	}
	$api.arguments.splice(0,2);
	$api.script.resolve("../../jsh/launcher/main.js").load();
} else {
	Packages.java.lang.System.err.println("Usage:");
	Packages.java.lang.System.err.println("unbuilt.rhino.js build <arguments>");
	Packages.java.lang.System.err.println("unbuilt.rhino.js launch <arguments>");
	Packages.java.lang.System.exit(1);
}
