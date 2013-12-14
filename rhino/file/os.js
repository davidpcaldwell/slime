//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var FilesystemProvider = $context.FilesystemProvider;

var JavaFilesystemProvider = function(peer) {
	this.PATHNAME_SEPARATOR = String( peer.getPathnameSeparator() );
	this.SEARCHPATH_SEPARATOR = String( peer.getSearchpathSeparator() );

	var SELF = this;
	var PARENT_PEER = peer;

	//	TODO	Build this into each separate filesystem separately
	var isAbsolute = function(string) {
		if (SELF.PATHNAME_SEPARATOR == "/") {
			if (string.substring(0,1) != "/") {
				return false;
			} else {
				return true;
			}
		} else if (SELF.PATHNAME_SEPARATOR == "\\") {
			if (string[1] == ":" || string.substring(0,2) == "\\\\") {
				return true;
			} else {
				return false;
			}
		} else {
			throw "Unreachable: PATHNAME_SEPARATOR = " + SELF.PATHNAME_SEPARATOR;
		}
	}

	//	TODO	Build this into each separate filesystem separately
	var isRootPath = function(string) {
		if (SELF.PATHNAME_SEPARATOR == "/") {
			return ( string == "/" ) || (string.substring(0,2) == "//" && string.substring(2).indexOf("/") == -1);
		} else if (SELF.PATHNAME_SEPARATOR == "\\") {
			if (string[1] == ":") {
				return string.length == 3 && string[2] == "\\";
			} else if (string.substring(0,2) == "\\\\") {
				return string.substring(2).indexOf("\\") == -1;
			} else {
				throw "Unreachable: path is " + string;
			}
		} else {
			throw "Unreachable: PATHNAME_SEPARATOR = " + SELF.PATHNAME_SEPARATOR;
		}
	}

	var newPeer = function(path) {
		if (path.substring(path.length-1) == SELF.PATHNAME_SEPARATOR) {
			if (isRootPath(path)) {
				//	ok then
			} else {
				path = path.substring(0,path.length-1);
			}
		}
		if (isAbsolute(path)) {
			path = FilesystemProvider.Implementation.canonicalize(path, SELF.PATHNAME_SEPARATOR);
			return PARENT_PEER.getNode(path);
		} else {
			return PARENT_PEER.getNode(new Packages.java.io.File(path));
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

	this.getParent = function(peer) {
		//	TODO	Skeptical of this implementation; had to make changes when implementing for HTTP filesystem
		var path = String( peer.getScriptPath() );
		if (this.isRootPath(path)) {
			return null;
		} else {
			//	TODO	Factor these implementations out by filesystem
			var newpath = function() {
				var tokens = path.split(SELF.PATHNAME_SEPARATOR);
				tokens.pop();
				if (tokens.length == 1) {
					if (SELF.PATHNAME_SEPARATOR == "/") {
						return "/";
					} else {
						return tokens[0] + SELF.PATHNAME_SEPARATOR;
					}
				} else {
					return tokens.join(SELF.PATHNAME_SEPARATOR);
				}
			}
			return this.newPathname(newpath());
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
			return new $context.api.io.Reader(peer.readText(), {LINE_SEPARATOR: String(PARENT_PEER.getLineSeparator())});
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
		return new Date( peer.getHostFile().lastModified() );
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
		var toPeer = peer.getNode(toPathname.java.adapt());
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
		var path = new $context.Pathname({ filesystem: SELF, peer: PARENT_PEER.getNode(jfile) });
		if (directory) {
			return path.directory;
		} else {
			return path.file;
		}
	}

	this.java = new function() {
		this.adapt = function(_jfile) {
			//	TODO	if no arguments, may want to someday consider returning the native peer of this object
			//	TODO	document this and write unit tests for it
			return new $context.Pathname({ filesystem: SELF, peer: PARENT_PEER.getNode(_jfile) });
		}
	};
}

var JavaFilesystem = function(_peer,os) {
	this.toString = function() {
		return "JavaFilesystem: peer=" + _peer;
	}

	var system = new JavaFilesystemProvider(_peer);

	if (os) {
		JavaFilesystemProvider.os = system;
	}

	this.Searchpath = function(array) {
		return new $context.Searchpath({ filesystem: system, array: array });
	}
	this.Searchpath.prototype = $context.Searchpath.prototype;
	this.Searchpath.parse = function(string) {
		if (!string) {
			throw new Error("No string to parse in Searchpath.parse");
		}
		var elements = string.split(system.SEARCHPATH_SEPARATOR);
		var array = elements.map(function(element) {
			return system.newPathname(element);
		});
		return new $context.Searchpath({ filesystem: system, array: array });
	}

	this.Pathname = function(string) {
		return system.newPathname(string);
	}

	this.$unit = new function() {
		//	Used by unit tests for getopts as well as unit tests for this module
		this.getSearchpathSeparator = function() {
			return system.SEARCHPATH_SEPARATOR;
		}
		this.getPathnameSeparator = function() {
			return system.PATHNAME_SEPARATOR;
		}
		this.temporary = function() {
			return system.temporary.apply(system,arguments);
		}
	}
//	FilesystemProvider.call(this,system);

	var self = this;

	this.java = system.java;
//	this.java = new function() {
//		this.adapt = function(_jfile) {
//			//	TODO	if no arguments, may want to someday consider returning the native peer of this object
//			//	TODO	document this and write unit tests for it
//			return new $context.Pathname({ filesystem: system, peer: peer.getNode(_jfile) });
//		}
//	};

	this.$jsh = new function() {
		//	Currently used by jsh.shell.getopts for Pathname
		this.PATHNAME_SEPARATOR = system.PATHNAME_SEPARATOR;

		//	TODO	probably can be replaced by .java.adapt() above
		this.Pathname = function($jfile) {
			return new $context.Pathname({ filesystem: system, peer: _peer.getNode($jfile) });
		}

		//	Interprets a native OS Pathname in this filesystem. Used, at least, for calculation of jsh.shell.PATH
		if (os) {
			this.os = function(pathname) {
				return pathname;
			}
		} else if ($context.api.isJavaType(Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem)(_peer)) {
			this.os = function(pathname) {
				return self.toUnix(pathname);
			}
		}
	}

	if ($context.api.isJavaType(Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem)(_peer)) {
		var isPathname = $context.isPathname;

		this.toUnix = function(item) {
			if (isPathname(item)) {
				return new $context.Pathname({ filesystem: system, peer: _peer.getNode( item.java.adapt() ) });
			}
			if (item instanceof $context.Searchpath) {
				return new $context.Searchpath({ filesystem: system, array: item.pathnames });
			}
			return item;
		}

		this.toWindows = function(item) {
			if (isPathname(item)) {
				//	Unbelievably horrendous workaround, but seems to work
				//	When creating a softlink to an exe in Windows, the softlink gets the .exe suffix added to it even if it is not on the
				//	command line.
				if (item.file == null && this.Pathname( item.toString() + ".exe" ).file != null ) {
					item = this.Pathname( item.toString() + ".exe" );
				}
				return JavaFilesystemProvider.os.importPathname( item );
			}
			//	Searchpath currently sets the constructor property to this module-level function; would this make this instanceof
			//	work?
			if (item instanceof $context.Searchpath) {
				//	TODO	convert underlying pathnames
				return new $context.Searchpath({ filesystem: JavaFilesystemProvider.os, array: item.pathnames });
			}
			return item;
		}
	}

	this.$unit.Pathname = function(peer) {
		return new $context.Pathname({ filesystem: system, peer: peer });
	}
	this.$unit.getNode = function() {
		return _peer.getNode.apply(_peer,arguments);
	}
}

var filesystems = {};
filesystems.os = new JavaFilesystem( Packages.inonit.script.runtime.io.Filesystem.create(), true );
if ( $context.cygwin ) {
	var $delegate;
	if ($context.cygwin.root && !$context.cygwin.paths) {
		$delegate = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root)
	} else {
		$delegate = Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create($context.cygwin.root,$context.cygwin.paths)
	}
	filesystems.cygwin = new JavaFilesystem($delegate);
	if ($context.addFinalizer) {
		$context.addFinalizer(function() {
			$delegate.finalize();
		});
	}
}

$exports.filesystems = filesystems;
$exports.Filesystem = $context.FilesystemProvider;
$api.deprecate($exports,"Filesystem");
