//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!this.$api) {
	Packages.java.lang.System.err.println("This script must be launched from jrunscript api.js.");
	Packages.java.lang.System.exit(1);
}

if (Packages.java.lang.System.getProperty("jsh.build.rhino")) {
	var rhino = new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.build.rhino"));
	if (!rhino.exists()) {
		$api.rhino.download().renameTo(rhino);
	}	
	Packages.java.lang.System.setProperty("jsh.build.rhino.jar", String(rhino.getCanonicalPath()));
}
$api.arguments.unshift("build");
$api.script.resolve("../../jsh/etc/unbuilt.rhino.js").load();
