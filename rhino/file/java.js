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
	 * @param { slime.jrunscript.file.internal.java.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.file.internal.java.Exports } $exports
	 */
	function(Packages,$context,$loader,$exports) {
		/** @type { slime.jrunscript.file.internal.spi.Script } */
		var code = $loader.script("spi.js");

		var spi = code();

		var defined = function(value,fallback) {
			if (typeof(value) != "undefined") return value;
			return fallback;
		};

		$exports.FilesystemProvider = Object.assign(
			/**
			 *
			 * @constructor
			 * @param { slime.jrunscript.native.inonit.script.runtime.io.Filesystem } _peer
			 */
			function(_peer) {
				var separators = {
					pathname: String(_peer.getPathnameSeparator()),
					searchpath: String(_peer.getSearchpathSeparator()),
					line: String(_peer.getLineSeparator())
				};

				this.separators = separators;

				//	TODO	Build this into each separate filesystem separately
				var isAbsolute = function(string) {
					if (separators.pathname == "/") {
						if (string.substring(0,1) != "/") {
							return false;
						} else {
							return true;
						}
					} else if (separators.pathname == "\\") {
						if (string[1] == ":" || string.substring(0,2) == "\\\\") {
							return true;
						} else {
							return false;
						}
					} else {
						throw "Unreachable: separators.pathname = " + separators.pathname;
					}
				}

				//	TODO	Build this into each separate filesystem separately
				var isRootPath = function(string) {
					if (separators.pathname == "/") {
						return ( string == "" || string == "/" ) || (string.substring(0,2) == "//" && string.substring(2).indexOf("/") == -1);
					} else if (separators.pathname == "\\") {
						if (string[1] == ":") {
							return string.length == 3 && string[2] == "\\";
						} else if (string.substring(0,2) == "\\\\") {
							return string.substring(2).indexOf("\\") == -1;
						} else {
							throw "Unreachable: path is " + string;
						}
					} else {
						throw "Unreachable: separators.pathname = " + separators.pathname;
					}
				}

				/**
				 *
				 * @param { string } path
				 */
				var newPeer = function(path) {
					if (path.substring(path.length-1) == separators.pathname) {
						if (isRootPath(path)) {
							//	ok then
						} else {
							path = path.substring(0,path.length-1);
						}
					}
					if (isAbsolute(path)) {
						path = spi.canonicalize(path, separators.pathname);
						return _peer.getNode(path);
					} else {
						return _peer.getNode(new Packages.java.io.File(path));
					}
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["newPathname"] } */
				this.newPathname = function(string) {
					return new $context.Pathname({ filesystem: this, peer: newPeer(string) });
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

				this.isRootPath = isRootPath;

				/**
				 *
				 * @param { string } path
				 */
				var newpath = function(path) {
					return spi.getParentPath(path,separators.pathname);
				};

				this.getParent = function getParent(peer) {
					//	TODO	Skeptical of this implementation; had to make changes when implementing for HTTP filesystem
					var path = String( peer.getScriptPath() );
					if (this.isRootPath(path)) {
						return null;
					} else {
						return this.newPathname(newpath(path));
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
				this.move = function(fromPeer,toPathname) {
					//	Seems Cygwin-ish but usage unknown
					if (toPathname.java["invalidate"]) {
						toPathname.java["invalidate"]();
					}
					var toPeer = _peer.getNode(toPathname.java.adapt());
					fromPeer.move(toPeer);
				}

				/** @type { slime.jrunscript.file.internal.java.FilesystemProvider["list"] } */
				this.list = function(peer) {
					return peer.list(null);
				}

				this.temporary = function(peer,parameters) {
					if (!parameters) parameters = {};
					var prefix = defined(parameters.prefix, "jsh");
					var suffix = defined(parameters.suffix, null);
					var directory = defined(parameters.directory, false);
					var jdir = (peer) ? peer.getHostFile() : null;
					var jfile = Packages.java.io.File.createTempFile(prefix,suffix,jdir);
					//	If this was request for directory, delete the temp file and create directory with same name
					if (directory) {
						jfile["delete"]();
						jfile.mkdir();
					}
					var path = new $context.Pathname({ filesystem: this, peer: _peer.getNode(jfile) });
					if (directory) {
						return path.directory;
					} else {
						return path.file;
					}
				}

				this.java = new (function(self) {
					this.adapt = function(_jfile) {
						//	TODO	if no arguments, may want to someday consider returning the peer of this object
						//	TODO	document this and write unit tests for it
						return new $context.Pathname({ filesystem: self, peer: _peer.getNode(_jfile) });
					}
				})(this);

				this.decorate = function(filesystem) {
					filesystem.java = this.java;
				}
			},
			{ os: void(0) }
		);
	}
//@ts-ignore
)(Packages,$context,$loader,$exports);
