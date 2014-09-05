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
		url: "http://coffeescript.org/extras/coffee-script.js"
	}
});

var response = new jsh.http.Client().request({ url: parameters.options.url });
if (response.status.code == 200) {
	var destination = jsh.shell.jsh.home.getRelativePath("plugins/coffee-script.js");
	jsh.shell.echo("Writing CoffeeScript to " + destination + " ...");
	destination.write(response.body.stream, { append: false });
} else {
	jsh.shell.echo("Response code: " + response.status.code + " for " + parameters.options.url);
	jsh.shell.exit(1);
}
jsh.shell.jsh.home.getRelativePath("coffee-script.js").write(new jsh.http.Client().request({ url: parameters.options.url }).body.stream, { append: false });
