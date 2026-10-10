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
		 * @param { slime.jrunscript.file.internal.java.Exports["filesystems"]["os"] } fs
		 * @param { { interpretNativePathname: any } } [o] Used only for Cygwin.
		 */
		var Filesystem = function(fs,o) {
			this.toString = function() {
				return "Filesystem: fs=" + fs;
			}

			//	TODO	we add createEmpty below, but do not seem to define it. Is it defined elsewhere, maybe?
			this.Searchpath = Object.assign(function(array) {
				return new $context.Searchpath({ filesystem: fs, array: array });
			}, { parse: void(0), createEmpty: void(0) });
			this.Searchpath.prototype = $context.Searchpath.prototype;
			this.Searchpath.parse = function(string) {
				if (!string) {
					throw new Error("No string to parse in Searchpath.parse");
				}
				var elements = string.split(fs.separator.searchpath);
				var array = elements.map(function(element) {
					return newPathname(fs, element);
				});
				return new $context.Searchpath({ filesystem: fs, array: array });
			}

			/** @type { slime.jrunscript.file.internal.filesystem.Filesystem["Pathname"] } */
			this.Pathname = function(string) {
				return newPathname(fs, string);
			}

			this.$unit = new function() {
				//	Used by unit tests for getopts as well as unit tests for this module
				this.getSearchpathSeparator = function() {
					return fs.separator.searchpath;
				}
				this.getPathnameSeparator = function() {
					return fs.separator.pathname;
				}
				this.temporary = function(parent,parameters) {
					if (!parameters) parameters = {};
					var parentPath = (parent && parent.getScriptPath) ? String(parent.getScriptPath()) : (parent && parent.pathname ? parent.pathname.toString() : parent);
					var pathname = newPathname(fs, $context.api.fp.world.now.ask(fs.temporary({
						parent: parentPath,
						prefix: parameters.prefix,
						suffix: parameters.suffix,
						directory: Boolean(parameters.directory)
					})));
					if (pathname.directory) return pathname.directory;
					if (pathname.file) return pathname.file;
					throw new Error();
				}
				this.Pathname = function(peer) {
					return newPathname(fs, String(peer.getScriptPath()));
				}
			}

			var self = this;

			this.java = {
				adapt: function(_file) {
					return newPathname(fs, fs.java.codec.File.decode(_file).pathname);
				}
			};

			this.$jsh = new function() {
				//	Currently used by jsh.script.getopts for Pathname
				this.PATHNAME_SEPARATOR = fs.separator.pathname;

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

		}

		/**
		 * @param { slime.jrunscript.file.internal.java.Exports["filesystems"]["os"] } fs
		 * @param { string } path
		 */
		function newPathname(fs, path) {
			var canonicalized = $context.api.fp.world.now.ask(fs.canonicalize({ pathname: path }));
			if (!canonicalized.present) throw new Error("Could not canonicalize: " + path);
			return new $context.Pathname({ filesystem: fs, pathname: canonicalized.value });
		}

		$exports.Filesystem = Filesystem;
	}
//@ts-ignore
)($context,$exports);
