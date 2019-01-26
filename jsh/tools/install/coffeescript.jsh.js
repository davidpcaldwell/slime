//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		url: "https://coffeescript.org/v2/browser-compiler/coffeescript.js"
	}
});

var file = jsh.tools.install.get({
	url: parameters.options.url
});

var destination = jsh.shell.jsh.lib.getRelativePath("coffee-script.js");

jsh.shell.console("Writing CoffeeScript to " + destination + " ...");
file.copy(destination);
