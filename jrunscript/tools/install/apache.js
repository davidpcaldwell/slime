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
	 * @param { slime.jrunscript.tools.install.apache.Context } $context
	 * @param { slime.jrunscript.tools.install.apache.Exports } $exports
	 */
	function(Packages,$api,$context,$exports) {
		var getMirror = function() {
			//	TODO	Apache prefers HTTPS, but let's try HTTP and see whether it passes GitHub Actions suite
			return "http://dlcdn.apache.org/";
		};

		$exports.find = function(p) {
			return function(events) {
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
					get: $api.fp.impure.Input.memoized(function() {
						return mirror + p.path
					})
				});
				events.fire("console", "Downloading from " + argument.url + " ...");
				return $context.get(argument);
			};
		};
	}
//@ts-ignore
)(Packages,$api,$context,$exports);
