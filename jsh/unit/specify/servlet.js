//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var slime = new jsh.file.Loader({ directory: $parameters.slime });
var loader = new jsh.file.Loader({ directory: jsh.file.Pathname("/").directory });

$exports.handle = function(request) {
	if (request.path == "") {
		return {
			status: { code: 200 },
			body: {
				string: JSON.stringify({
					api: $parameters.api.toString(),
					debug: $parameters.debug
				},void(0),"    ")
			}
		}
	}

	if (request.path == "$reload") {
		if ($parameters.debug) httpd.$reload();
		return {
			status: { code: 200 },
			body: {
				string: ($parameters.debug) ? "Reloaded." : "Not reloaded; debug = " + $parameters.debug
			}
		};
	}

	if (request.path == "favicon.ico") {
		return {
			status: { code: 404 }
		}
	}

	if ($loader.get(request.path)) {
		return {
			status: { code: 200 },
			body: $loader.get(request.path)
		}
	}

	var slimeMatcher = /^slime\/(.*)/;
	var slimeMatch = slimeMatcher.exec(request.path);
	if (slimeMatch) {
		var rv = slime.get(slimeMatch[1]);
		if (rv) {
			return {
				status: { code: 200 },
				body: rv
			};
		} else {
			return {
				status: { code: 404 }
			}
		}
	}

	var filesystem = /^filesystem\/(.*)/
	var match = filesystem.exec(request.path);
	if (match) {
		var rv = loader.get(match[1]);
		if (rv) {
			return {
				status: { code: 200 },
				body: rv
			};
		} else {
			return {
				status: { code: 200 },
				body: {
					type: "text/html",
					string: $parameters.slime.getFile("loader/api/api.template.html").read(String)
				}
			}
		}
	}
};
