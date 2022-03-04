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
å	 * @param { slime.loader.Export<slime.jrunscript.file.internal.spi.Exports> } $export
	 */
	function(Packages,$export) {
		var javaSpiAvailable = typeof(Packages.inonit.script.runtime.io.Filesystem.Optimizations) == "function";
		if (!javaSpiAvailable) {
			$export({
				canonicalize: function(string,separator) {
					var tokens = string.split(separator);
					var rv = [];
					for (var i=0; i<tokens.length; i++) {
						var name = tokens[i];
						if (name == ".") {
							//	do nothing
						} else if (name == "..") {
							rv.pop();
						} else {
							rv.push(name);
						}
					}
					return rv.join(separator);
				},
				getParentPath: function(path,separator) {
					//	TODO	Factor these implementations out by filesystem
					var tokens = path.split(separator);
					tokens.pop();
					if (tokens.length == 1) {
						//	TODO	wait, aren't these equivalent?
						if (separator == "/") {
							return "/";
						} else {
							return tokens[0] + separator;
						}
					} else {
						return tokens.join(separator);
					}
				}
			})
		} else {
			var _spi = Packages.inonit.script.runtime.io.Filesystem.Optimizations.INSTANCE;
			$export({
				canonicalize: function(string,separator) {
					return String(_spi.canonicalize(string,separator));
				},
				getParentPath: function(string,separator) {
					return String(_spi.getParentPath(string,separator));
				}
			})
		}
	}
//@ts-ignore
)(Packages,$export);
