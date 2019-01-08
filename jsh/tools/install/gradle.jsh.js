//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var URL = "https://services.gradle.org/distributions/gradle-4.8-bin.zip";

jsh.tools.install.install({
	url: URL,
	format: jsh.tools.install.format.zip,
	to: jsh.shell.jsh.lib.getRelativePath("gradle"),
	getDestinationPath: function(file) {
		return "gradle-4.8";
	}
}, {
	console: function(e) {
		jsh.shell.console(e.message);
	}
});
