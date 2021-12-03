//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.file.internal.filesystem.Context } $context
	 * @param { slime.jrunscript.file.internal.filesystem.Exports } $exports
	 */
	function($context,$exports) {
		/**
		 *
		 * @param { slime.jrunscript.file.internal.java.FilesystemProvider } system
		 * @param { { interpretNativePathname: any } } [o] Used only for Cygwin.
		 */
		var Filesystem = function(system,o) {
			this.toString = function() {
				return "Filesystem: provider=" + system;
			}

			this.Searchpath = Object.assign(function(array) {
				return new $context.Searchpath({ filesystem: system, array: array });
			}, { parse: void(0) });
			this.Searchpath.prototype = $context.Searchpath.prototype;
			this.Searchpath.parse = function(string) {
				if (!string) {
					throw new Error("No string to parse in Searchpath.parse");
				}
				var elements = string.split(system.separators.searchpath);
				var array = elements.map(function(element) {
					return system.newPathname(element);
				});
				return new $context.Searchpath({ filesystem: system, array: array });
			}

			/** @type { slime.jrunscript.file.internal.filesystem.Filesystem["Pathname"] } */
			this.Pathname = function(string) {
				return system.newPathname(string);
			}

			this.$unit = new function() {
				//	Used by unit tests for getopts as well as unit tests for this module
				this.getSearchpathSeparator = function() {
					return system.separators.searchpath;
				}
				this.getPathnameSeparator = function() {
					return system.separators.pathname;
				}
				this.temporary = function() {
					return system.temporary.apply(system,arguments);
				}
				this.Pathname = function(peer) {
					return new $context.Pathname({ filesystem: system, peer: peer });
				}
			}

			var self = this;

			this.java = system.java;

			this.$jsh = new function() {
				//	Currently used by jsh.shell.getopts for Pathname
				this.PATHNAME_SEPARATOR = system.separators.pathname;

				//	Interprets an OS Pathname in this filesystem. Used, at least, for calculation of jsh.shell.PATH
				//	TODO	could/should this be replaced with something that uses a java.io.File?
				if (!o || !o.interpretNativePathname) {
					this.os = function(pathname) {
						return pathname;
					}
				} else {
					this.os = function(pathname) {
						return o.interpretNativePathname.call(self,pathname);
					}
				}
			}

			if (system.decorate) system.decorate(this);
		}

		$exports.Filesystem = Filesystem;
	}
//@ts-ignore
)($context,$exports);
