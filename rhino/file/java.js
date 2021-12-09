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
	 * @param { slime.jrunscript.file.internal.java.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.file.internal.java.Exports } $exports
	 */
	function(Packages,$api,$context,$loader,$exports) {
		/** @type { slime.jrunscript.file.internal.spi.Script } */
		var code = $loader.script("spi.js");

		var spi = code();

		var defined = function(value,fallback) {
			if (typeof(value) != "undefined") return value;
			return fallback;
		};

		/**
		 *
		 * @param { string } path
		 * @returns
		 */
		var fixWindowsForwardSlashes = function(path) {
			return path.replace(/\//g, "\\");
		}

		var $$api = {
			RegExp: {
				/**
				 *
				 * @param { RegExp } r
				 * @returns
				 */
				exec: function(r) {
					/**
					 * @param { string } s
					 */
					return function(s) {
						return r.exec(s);
					}
				}
			}
		}

		var systems = {
			/** @type { slime.jrunscript.file.internal.java.System } */
			unix: {
				separator: {
					file: "/"
				},
				isAbsolute: function(string) {
					if (string.substring(0,1) != "/") {
						return false;
					} else {
						return true;
					}
				},
				isRootPath: function(string) {
					return ( string == "" || string == "/" ) || (string.substring(0,2) == "//" && string.substring(2).indexOf("/") == -1);
				}
			},
			/** @type { slime.jrunscript.file.internal.java.System } */
			windows: {
				separator: {
					file: "\\"
				},
				isAbsolute: $api.Function.pipe(fixWindowsForwardSlashes, function(string) {
					if (string[1] == ":" || string.substring(0,2) == "\\\\") {
						return true;
					} else {
						return false;
					}
				}),
				isRootPath: $api.Function.pipe(fixWindowsForwardSlashes, function(string) {
					if (string.substring(1,2) == ":") {
						return string.length == 3 && string[2] == "\\";
					} else if (string.substring(0,2) == "\\\\") {
						return string.substring(2).indexOf("\\") == -1;
					} else {
						return false;
					}
				})
			}
		};

		/**
		 *
		 * @param { string } separator
		 * @returns
		 */
		var systemForPathnameSeparator = function(separator) {
			return Object.entries(systems).map(function(entry) {
				return entry[1];
			}).find(function(system) {
				return system.separator.file == separator;
			});
		}

		/**
		 *
		 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
		 */
		var systemForFilesystem = function(_peer) {
			var separator = String(_peer.getPathnameSeparator());
			return systemForPathnameSeparator(separator);
		}

		/**
		 *
		 * @param { slime.jrunscript.file.internal.java.System } system
		 * @returns
		 */
		function trailingSeparatorRemover(system) {
			/**
			 *
			 * @param { string } path
			 */
			function removeTrailingSeparator(path) {
				var matchTrailingSlash = $api.Function.result(
					/(.*)/,
					$api.Function.RegExp.modify(function(pattern) {
						return pattern + "\\" + system.separator.file + "$";
					})
				);
				var withoutTrailingSlash = matchTrailingSlash.exec(path);
				if (withoutTrailingSlash && !system.isRootPath(path)) {
					return withoutTrailingSlash[1];
				} else {
					return path;
				}
			}
			var fixArgument = (system == systems.windows) ? fixWindowsForwardSlashes : $api.Function.identity;
			return $api.Function.pipe(fixArgument, removeTrailingSeparator);
		}

		/**
		 *
		 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
		 */
		function nodeCreator(_peer) {
			var os = systemForFilesystem(_peer);
			/**
			 *
			 * @param { string } path
			 */
			function createNode(path) {
				if (os.isAbsolute(path)) {
					path = spi.canonicalize(path, os.separator.file);
					return _peer.getNode(path);
				} else {
					return _peer.getNode(new Packages.java.io.File(path));
				}
			}
			return createNode;
		}

		$exports.FilesystemProvider = Object.assign(
			/**
			 *
			 * @constructor
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
			 */
			function(_peer) {
				var os = systemForFilesystem(_peer);

				var separators = {
					pathname: String(_peer.getPathnameSeparator()),
					searchpath: String(_peer.getSearchpathSeparator()),
					line: String(_peer.getLineSeparator())
				};

				this.separators = separators;

				var newPeer = nodeCreator(_peer);

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["newPeer"] } */
				this.newPeer = function(string) {
					return newPeer(string);
				}

				this.importPathname = function(pathname) {
					throw new Error("Theorized to be unused, at least excluding Cygwin.");
					//return new $context.Pathname({ filesystem: this, peer: peer.getNode( pathname.java.adapt() ) });
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["exists"] } */
				this.exists = function(peer) {
					return peer.exists();
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["isDirectory"] } */
				this.isDirectory = function(peer) {
					return peer.isDirectory();
				}

				this.peerToString = function(peer) {
					return String( peer.getScriptPath() );
				}

				this.isRootPath = os.isRootPath;

				/**
				 *
				 * @param { string } path
				 */
				var newpath = function(path) {
					return spi.getParentPath(path,separators.pathname);
				};

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["getParent"] } */
				this.getParent = function getParent(peer) {
					//	TODO	Skeptical of this implementation; had to make changes when implementing for HTTP filesystem
					var path = String( peer.getScriptPath() );
					if (this.isRootPath(path)) {
						return null;
					} else {
						return this.newPeer(newpath(path));
					}
				}

				this.createDirectoryAt = function(peer) {
					return peer.mkdirs();
				}

				this.read = new function() {
					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["read"]["binary"] } */
					this.binary = function(peer) {
						return $context.api.io.Streams.java.adapt(peer.readBinary());
					}

					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["read"]["character"] } */
					this.character = function(peer) {
						return $context.api.io.Streams.java.adapt(peer.readText()/*, {LINE_SEPARATOR: separators.line}*/);
					}
				}

				this.write = new function() {
					/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["write"]["binary"] } */
					this.binary = function(peer,append) {
						return $context.api.io.Streams.java.adapt(peer.writeBinary(append));
					}
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["getLastModified"] } */
				this.getLastModified = function(peer) {
					var modified = peer.getHostFile().lastModified();
					if (typeof(modified) == "object") {
						//	Nashorn treats it as object
						modified = Number(String(modified));
					}
					return new Date( modified );
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["setLastModified"] } */
				this.setLastModified = function(peer,date) {
					peer.getHostFile().setLastModified( date.getTime() );
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["remove"] } */
				this.remove = function(peer) {
					peer["delete"]();
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["move"] } */
				this.move = function(fromPeer,to) {
					var toPeer = _peer.getNode(to.getHostFile());
					fromPeer.move(toPeer);
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["list"] } */
				this.list = function(peer) {
					return peer.list(null);
				}

				this.temporary = function(peer,parameters) {
					if (!parameters) parameters = {};
					var prefix = defined(parameters.prefix, "slime");
					var suffix = defined(parameters.suffix, null);
					var directory = defined(parameters.directory, false);
					var jdir = (peer) ? peer.getHostFile() : null;
					var jfile = Packages.java.io.File.createTempFile(prefix,suffix,jdir);
					//	If this was request for directory, delete the temp file and create directory with same name
					if (directory) {
						jfile["delete"]();
						jfile.mkdir();
					}
					return _peer.getNode(jfile);
				}

				this.java = new (function(self) {
					this.adapt = function(_jfile) {
						//	TODO	if no arguments, may want to someday consider returning the peer of this object
						//	TODO	document this and write unit tests for it
						return new $context.Pathname({ filesystem: self, peer: _peer.getNode(_jfile) });
					}
				})(this);

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["decorate"] } */
				this.decorate = function(filesystem) {
					filesystem.java = this.java;
				}
			},
			{ os: void(0) }
		);

		$exports.test = {
			unix: systems.unix,
			windows: systems.windows,
			systemForPathnameSeparator: systemForPathnameSeparator,
			trailingSeparatorRemover: trailingSeparatorRemover,
			nodeCreator: nodeCreator
		}
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$exports);
