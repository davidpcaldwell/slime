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

var base = jsh.file.Pathname($parameters.base).directory;
var resources = new jsh.file.Loader({ directory: base });
$exports.handle = function(request) {
	jsh.shell.echo("Got request: " + request.path);
	var resource = resources.resource(request.path);
	jsh.shell.echo("Base is " + base);
	debugger;
	jsh.shell.echo("Resource is " + resource);
	if (resource) {
		return {
			status: { code: 200 },
			body: resource
		}
	} else {
		return {
			status: { code: 404 }
		}
	}
};
