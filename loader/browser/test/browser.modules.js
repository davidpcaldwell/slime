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

$exports.handle = function(request) {
	var resource = httpd.loader.resource(request.path);
	jsh.shell.echo(request.path + " = " + resource);
	if (resource) {
		var type;
		//	TODO	wire this into servlet container MIME type specification
		if (false) {

		} else if (/\.html$/.test(request.path)) {
			type = "text/html";
		} else if (/\.js$/.test(request.path)) {
			//	TODO	check for correctness
			type = "application/javascript";
		} else if (/\.coffee$/.test(request.path)) {
			//	TODO	check for correctness
			type = "text/coffeescript";
		} else {
			throw new Error("Unknown type: " + request.path);
		}
		return {
			status: {
				code: 200
			},
			body: {
				type: type,
				stream: resource.read(jsh.io.Streams.binary)
			}
		};
	} else {
		return {
			status: {
				code: 404
			}
		};
	}
}
