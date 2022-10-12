//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { { client: slime.jrunscript.http.client.object.Client, downloads: slime.jrunscript.file.Directory, get: slime.jrunscript.tools.install.Exports["get"] } } $context
	 * @param { { find: slime.jrunscript.tools.install.Exports["apache"]["find"] } } $exports
	 */
	function(Packages,$api,$context,$exports) {
		var getMirror = function() {
			return $context.client.request({
				url: "http://www.apache.org/dyn/closer.cgi?asjson=1",
				evaluate: function(response) {
					var json = eval("(" + response.body.stream.character().asString() + ")");
					return json.preferred;
				}
			});
		}

		$exports.find = $api.events.Function(
			function(p,events) {
				var name = p.path.split("/").slice(-1)[0];
				if ($context.downloads) {
					if ($context.downloads.getFile(name)) {
						events.fire("console", "Found " + name + " in " + $context.downloads + "; using local copy.");
						return $context.get({
							file: $context.downloads.getFile(name)
						})
					}
				}
				var mirror = (p.mirror) ? p.mirror : getMirror();
				var argument = {
					name: p.path.split("/").slice(-1)[0],
					url: void(0)
				};
				Object.defineProperty(argument, "url", {
					get: $api.fp.memoized(function() {
						return mirror + p.path
					})
				});
				return $context.get(argument);
			}, {
				console: function(e) {
					Packages.java.lang.System.err.println(e.detail);
				}
			}
		);
	}
//@ts-ignore
)(Packages,$api,$context,$exports);
