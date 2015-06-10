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

var api = jsh.script.loader.file("api.js");

var destination = jsh.shell.jsh.home.getRelativePath("plugins/coffee-script.js");
var code = api.download({
	url: parameters.options.url
});
jsh.shell.echo("Writing CoffeeScript to " + destination + " ...");
destination.write(code.read(jsh.io.Streams.binary), { append: false });
