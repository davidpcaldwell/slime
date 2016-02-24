//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.handle = function(request) {
	var qualifier = /^jsh\/unit\/browser\/(.*)/;
	if (qualifier.exec(request.path)) {
		request.path = qualifier.exec(request.path)[1];
	}
	if (/\.html$/.test(request.path) || /\.js$/.test(request.path) || /\.css$/.test(request.path)) {
		return {
			status: { code: 200 },
			body: $loader.resource(request.path)
		};
	}
	if (request.path == "structure") {
		var getStructure = function(part) {
			var rv = {
				id: part.id,
				name: part.name
			};
			if (part.getParts) {
				var parts = part.getParts();
				rv.parts = {};
				for (var x in parts) {
					rv.parts[x] = getStructure(parts[x]);
				}
			}
			return rv;
		};
		
		var getPartStructure = function(part) {
			
		}
		
		return {
			status: { code: 200 },
			body: {
				type: "application/json",
				string: JSON.stringify(getStructure($context.suite), void(0), "    ")
			}
		}
	}
	if (request.path == "messages") {
		return {
			status: { code: 200 },
			body: {
				type: "application/json",
				string: JSON.stringify($context.messages(), void(0), "    ")
			}
		}
	}
	if (request.path == "run") {
		var json = JSON.parse(request.body.stream.character().asString());
		jsh.java.Thread.start(function() {
			$context.suite.run({
				scope: {},
				path: json
			});
		});
		return {
			status: { code: 200 },
			body: {
				type: "application/json",
				string: JSON.stringify({}, void(0), "    ")
			}
		}
	}
}

