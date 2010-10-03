//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/file SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

//	Required in scope (combined for filesystem.js and this file):
//	defined: js/object defined
//	deprecate: js/object deprecate
//	experimental: js/object experimental
//	fail: rhino/host fail
//	warning: function which handles single-argument (string) warning
//	constant: function which takes a function and returns the same value every time (after being invoked the first time).

//	This is the current working directory, in the OS filesystem, apparently as a string
var $pwd = $context.$pwd;

//	This variable contains information about the Cygwin filesystem, and will cause a filesystems.cygwin object to be created
//	if it exists.
var cygwin = $context.cygwin;

//	TODO	Get rid of this
var $script = {};

var streams = $context.streams;
var deprecate = $context.deprecate;
var isJavaType = $context.isJavaType;
//var Pathname = $context.Pathname;

var Streams = streams.Streams;

var Filesystem = function(implementation) {
	this.Searchpath = function(array) {
		return new $context.Searchpath({ filesystem: implementation, array: array });
	}

	this.Pathname = function(string) {
		return implementation.newPathname(string);
	}

	this.$unit = new function() {
		//	Used by unit tests for getopts as well as unit tests for this module
		this.getSearchpathSeparator = function() {
			return implementation.SEARCHPATH_SEPARATOR;
		}
		this.getPathnameSeparator = function() {
			return implementation.PATHNAME_SEPARATOR;
		}
	}
}
Filesystem.Implementation = function() {
}
Filesystem.Implementation.canonicalize = function(string,separator) {
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
}

var SystemFilesystem = function(peer) {
	this.toString = function() {
		return "SystemFilesystem: peer=" + peer;
	}

	var PARENT = this;

	var system = new function() {
		this.PATHNAME_SEPARATOR = String( peer.getPathnameSeparator() );
		this.SEARCHPATH_SEPARATOR = String( peer.getSearchpathSeparator() );

		var newPeer = function(path) {
			return PARENT_PEER.getNode(path);
		}

		this.newPathname = function(string) {
			var newPathnameFromString = function(aString) {
				var canonicalize = function(string) {
					//	TODO Canonicalize drive letter and slashes in Windows
					return Filesystem.Implementation.canonicalize(string, SELF.PATHNAME_SEPARATOR);
				}
				return new $context.Pathname({ filesystem: SELF, peer: newPeer(canonicalize(aString)) });
			}

			return newPathnameFromString(string);
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

		var SELF = this;
		var PARENT_PEER = peer;

		//	TODO	Build this into each separate filesystem separately
		this.isRootPath = function(string) {
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
				return new streams.InputStream(peer.readBinary());
			}

			this.character = function(peer) {
				return new streams.Reader(peer.readText(), {LINE_SEPARATOR: String(PARENT_PEER.getLineSeparator())});
			}
		}

		this.write = new function() {
			this.binary = function(peer,append) {
				return new streams.OutputStream(peer.writeBinary(append));
			}

			this.character = function(peer,append) {
				return new streams.Writer(peer.writeText(append));
			}

			this.string = function(peer,append,string) {
				var stream = new streams.Writer(peer.writeText(append));
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
			peer["delete"]();
		}

		this.list = function(peer) {
			return peer.list(null);
		}

		this.temporary = function(peer,parameters) {
			if (!parameters) parameters = {};
			var prefix = defined(parameters.prefix, "jsh");
			var suffix = defined(parameters.suffix, null);
			var directory = defined(parameters.directory, false);
			var jfile = Packages.java.io.File.createTempFile(prefix,suffix,peer.getHostFile());
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

		var mapPathnameFunction = function(filesystem) {
			return function(pathname) {
				var pathnameType;
				if (isJavaType(Packages.inonit.script.runtime.io.Filesystem.NativeFilesystem.NodeImpl)(pathname.$peer)) {
					pathnameType = "os";
				} else if (isJavaType(Packages.inonit.script.runtime.io.cygwin.NodeImpl)(pathname.$peer)) {
					pathnameType = "cygwin";
				}
				if (pathnameType == "cygwin" && filesystem == filesystems.os) {
					return filesystems.cygwin.toWindows(pathname);
				} else if (pathnameType == "os" && filesystem == filesystems.cygwin) {
					return filesystems.cygwin.toUnix(pathname);
				} else {
					return pathname;
				}
			};
		}

		//	TODO	If not getting rid of this, merge with mapPathnameFunction?
		this.$inFilesystem = function(pathname) {
			if (pathname.$filesystem == filesystems.cygwin && PARENT == filesystems.os) {
				return filesystems.cygwin.toWindows(this);
			} else if (pathname.$filesystem == filesystems.os && PARENT == filesystems.cygwin) {
				return filesystems.cygwin.toUnix(this);
			} else {
				return pathname;
			}
		}
		deprecate(this,"$inFilesystem");

		this.$Searchpath = {
			mapPathname: mapPathnameFunction(PARENT)
		}
	}

	Filesystem.call(this,system);

	this.$jsh = new function() {
		//	Currently used by getopts for Pathname
		this.PATHNAME_SEPARATOR = system.PATHNAME_SEPARATOR;

		this.Pathname = function($jfile) {
			return new $context.Pathname({ filesystem: system, peer: peer.getNode($jfile) });
		}
	}

	//	Only known use of this property is by toWindows method of Cygwin filesystem
	//	TODO	Doesn't isJavaType return a function? So isn't the second half of the test below always true? Probably should take
	//			peer as an argument
	if (cygwin && isJavaType(Packages.inonit.script.runtime.io.Filesystem.NativeFilesystem)(peer)) {
		this.$peer = peer;
		deprecate(this,"$peer");

		this.$system = system;
		deprecate(this,"$system");
	}

	if (isJavaType(Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem)(peer)) {
		this.toUnix = function(item) {
			if (item instanceof $context.Pathname) {
				return new $context.Pathname({ filesystem: system, peer: peer.getNode( item.$peer.getHostFile() ) });
			}
			if (item instanceof $context.Searchpath) {
				return new $context.Searchpath({ filesystem: system, array: item.pathnames });
			}
			return item;
		}

		this.toWindows = function(item) {
			if (item instanceof $context.Pathname) {
				//	Unbelievably horrendous workaround, but seems to work
				//	When creating a softlink to an exe in Windows, the softlink gets the .exe suffix added to it even if it is not on the
				//	command line.
				if (item.file == null && $context.Pathname( item.toString() + ".exe" ).file != null ) {
					item = $context.Pathname( item.toString() + ".exe" );
				}
				return new $context.Pathname({ filesystem: filesystems.os.$system, peer: filesystems.os.$peer.getNode( item.$peer.getHostFile() ) });
			}
			if (item instanceof $context.Searchpath) {
				return new $context.Searchpath({ filesystem: filesystems.os.$system, array: item.pathnames });
			}
			return item;
		}
	}

	this.$unit.Pathname = function(peer) {
		return new $context.Pathname({ filesystem: system, peer: peer });
	}
	this.$unit.getNode = function() {
		return peer.getNode.apply(peer,arguments);
	}
}

var filesystems = {};
filesystems.os = new SystemFilesystem( Packages.inonit.script.runtime.io.Filesystem.create() );
if ( cygwin ) {
	if (cygwin.root && !cygwin.paths) {
		filesystems.cygwin = new SystemFilesystem(
			new Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem(cygwin.root)
		);
	} else {
		filesystems.cygwin = new SystemFilesystem(
			Packages.inonit.script.runtime.io.cygwin.CygwinFilesystem.create(cygwin.root,cygwin.paths)
		);
	}
}

var defaults = {};
//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through $script.setFilesystem
defaults.filesystem = (filesystems.cygwin) ? filesystems.cygwin : filesystems.os;

this.__defineGetter__("workingDirectory", function() {
	if ($pwd) {
		var osdir = filesystems.os.Pathname($pwd);
		if (defaults.filesystem == filesystems.cygwin) {
			osdir = filesystems.cygwin.toUnix(osdir);
		}
		return osdir.directory;
	}
} );

$exports.Filesystem = Filesystem;
$exports.filesystems = filesystems;
$exports.defaults = defaults;
$exports.__defineGetter__("workingDirectory", this.__lookupGetter__("workingDirectory"));
