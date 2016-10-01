//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.FilesystemProvider = function(_peer) {
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
			return ( string == "/" ) || (string.substring(0,2) == "//" && string.substring(2).indexOf("/") == -1);
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

	var newPeer = function(path) {
		if (path.substring(path.length-1) == separators.pathname) {
			if (isRootPath(path)) {
				//	ok then
			} else {
				path = path.substring(0,path.length-1);
			}
		}
		if (isAbsolute(path)) {
			path = $context.spi.canonicalize(path, separators.pathname);
			return _peer.getNode(path);
		} else {
			return _peer.getNode(new Packages.java.io.File(path));
		}
	}

	this.newPathname = function(string) {
		return new $context.Pathname({ filesystem: this, peer: newPeer(string) });
	}

	this.importPathname = function(pathname) {
		return new $context.Pathname({ filesystem: this, peer: peer.getNode( pathname.java.adapt() ) });
	}

	this.exists = function(peer) {
		return peer.exists();
	}

	this.isDirectory = function(peer) {
		return peer.isDirectory();
	}

	this.peerToString = function(peer) {
		return String( peer.getScriptPath() );
	}

	this.isRootPath = isRootPath;

	var newpath = function(path) {
		return $context.spi.getParentPath(path,separators.pathname);
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
		this.binary = function(peer) {
			return new $context.api.io.InputStream(peer.readBinary());
		}

		this.character = function(peer) {
			return new $context.api.io.Reader(peer.readText(), {LINE_SEPARATOR: separators.line});
		}
	}

	this.write = new function() {
		this.binary = function(peer,append) {
			return new $context.api.io.OutputStream(peer.writeBinary(append));
		}

		this.character = function(peer,append) {
			return new $context.api.io.Writer(peer.writeText(append));
		}

		this.string = function(peer,append,string) {
			var stream = new $context.api.io.Writer(peer.writeText(append));
			stream.write(string);
			stream.close();
		}
	}

	this.getLastModified = function(peer) {
		var modified = peer.getHostFile().lastModified();
		if (typeof(modified) == "object") {
			//	Nashorn treats it as object
			modified = Number(String(modified));
		}
		return new Date( modified );
	}

	this.setLastModified = function(peer,date) {
		peer.getHostFile().setLastModified( date.getTime() );
	}

	this.remove = function(peer) {
		return peer["delete"]();
	}

	this.move = function(fromPeer,toPathname) {
		if (toPathname.java.invalidate) {
			debugger;
			toPathname.java.invalidate();
		}
		var toPeer = _peer.getNode(toPathname.java.adapt());
		fromPeer.move(toPeer);
	}

	this.list = function(peer) {
		return peer.list(null);
	}

	this.temporary = function(peer,parameters) {
		if (!parameters) parameters = {};
		var prefix = $context.api.defined(parameters.prefix, "jsh");
		var suffix = $context.api.defined(parameters.suffix, null);
		var directory = $context.api.defined(parameters.directory, false);
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
}
