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

var defined = $context.defined;
var defaults = $context.defaults;
var constant = $context.constant;
var deprecate = $context.deprecate;
var fail = $context.fail;
var warning = $context.warning;

var Pathname = function(parameters) {
	if (this.constructor != arguments.callee) {
		//	not called as constructor but as function
		//	perform a "cast"
		if (typeof(parameters) == "string") {
			return defaults.filesystem.Pathname(parameters);
		} else if (typeof(parameters) == "object" && parameters instanceof String) {
			return defaults.filesystem.Pathname(parameters.toString());
		} else {
			fail("Illegal argument to Pathname(): " + parameters);
		}
	}

	if (!parameters) {
		fail("Missing argument to new Pathname()");
	}

	if (parameters.$filesystem) warning("DEPRECATED: new Pathname() parameter '$filesystem'");
	var $filesystem = defined(parameters.filesystem,parameters.$filesystem,defaults.filesystem);
	if (!$filesystem.peerToString) fail("Internal error; Pathname constructed incorrectly: " + parameters.toSource());

	var peer = (function() {
		if (parameters.$path) warning("DEPRECATED: new Pathname() parameter '$path'");
		if (parameters.$peer) warning("DEPRECATED: new Pathname() parameter '$peer'");
		if (parameters.path) warning("DEPRECATED: new Pathname() parameter 'path'");
		var path = defined(parameters.path,parameters.$path);
		//	TODO	below line appears to invoke nonexistent method
		if (path) return $filesystem.getPeer(path);
		var peer = defined(parameters.peer,parameters.$peer);
		if (peer) return peer;
		if (parameters.toSource) {
			fail("Missing new Pathname() arguments: " + parameters.toSource());
		} else {
			fail("Missing new Pathname() arguments: " + parameters);
		}
	})();

	var toString = constant(function() {
		var rv = $filesystem.peerToString(peer);
		if (parameters.directory && (rv.substring(-1) != $filesystem.PATHNAME_SEPARATOR)) {
			rv += $filesystem.PATHNAME_SEPARATOR;
		}
		return rv;
	});

	this.toString = toString;

	var getBasename = constant(function() {
		var path = toString();
		if ($filesystem.isRootPath(path)) return path;
		if (path.substring(path.length-1) == $filesystem.PATHNAME_SEPARATOR) {
			path = path.substring(0,path.length-1);
		}
		var tokens = path.split($filesystem.PATHNAME_SEPARATOR);
		return tokens.pop();
	});
	this.__defineGetter__("basename", getBasename);

	var getParent = constant(function() {
		return $filesystem.getParent(peer);
	});
	this.__defineGetter__("parent", getParent);

	var getFile = function() {
		if (!$filesystem.exists(peer)) return null;
		if ($filesystem.isDirectory(peer)) return null;
		return new File(this,peer);
	}
	this.__defineGetter__("file", getFile);

	var getDirectory = function() {
		if (!$filesystem.exists(peer)) return null;
		if (!$filesystem.isDirectory(peer)) return null;
		var pathname = new Pathname({ filesystem: $filesystem, peer: peer, directory: true });
		return new Directory(pathname,peer);
	}
	this.__defineGetter__("directory", getDirectory);

	var write = function(dataOrType,mode) {
		if (!mode) mode = {};

		var prepareWrite = function(mode) {
			//	TODO	Right now we can specify a file where we do not want to create its directory, and a file where we do want to
			//			create it, but not one where we are willing to create its directory but not parent directories.  Is that OK?
			if ($filesystem.exists(peer)) {
				var append = mode.append;
				if (typeof(append) == "undefined") {
					if (mode.overwrite) {
						warning("DEPRECATED: writeXXX() mode property overwrite; use mode property append");
						append = false;
					}
				}
				if (append == true) {
				} else if (append == false) {				
				} else {
					throw new Error("Cannot create file at " + toString() + "; already exists (use append to override)");
				}
			}
			if (!getParent().directory) {
				if (!mode.recursive) {
					throw new Error("Cannot create file at " + toString() + "; parent directory does not exist (use recursive to override)");
				} else {
					getParent().createDirectory({ recursive: true });
				}
			}
		}

		prepareWrite(mode);

		var append = Boolean(mode.append);

		//	TODO	adapt to use rhino/io Resource write method
		if (dataOrType == $context.Streams.binary) {
			return $filesystem.write.binary(peer,append);
		} else if (dataOrType == $context.Streams.text) {
			return $filesystem.write.character(peer,append);
		} else if (typeof(dataOrType) == "string") {
			$filesystem.write.string(peer,append,dataOrType);
		} else if (dataOrType.$getInputStream) {
			var stream = $filesystem.write.binary(peer,append);
			$context.Streams.binary.copy(dataOrType,stream);
			stream.close();
		} else if (dataOrType.$getReader) {
			var stream = $filesystem.write.character(peer,append);
			$context.Streams.text.copy(dataOrType,stream);
			stream.close();
		} else {
			fail("Unimplemented: write " + dataOrType);
		}
	}

	this.write = write;

	this.createDirectory = function(mode) {
		if (!mode) mode = {};
		if (!mode.ifExists) {
			mode.ifExists = function() { throw new Error("Cannot create directory; already exists: " + toString()); }
		}
		if ($filesystem.exists(peer)) {
			var getNode = function() {
				if ($filesystem.isDirectory(peer)) return getDirectory();
				return getFile();
			}
			var proceed = mode.ifExists(getNode());
			if (!proceed) {
				//	We return null if a non-directory file exists but ifExists returns false (do not proceed with creating directory).
				return getDirectory();
			}
		}

		if (mode.recursive) {
			$filesystem.createDirectoryAt(peer);
		} else {
			if (!getParent().directory) {
				throw new Error("Could not create: " + toString() + "; parent directory does not exist.");
			}
			$filesystem.createDirectoryAt(peer);
		}
		return getDirectory();
	}

	this.java = new function() {
		//	Undocumented; used only by mapPathname, which is used only by Searchpath, all of which are dubious
		this.getPeer = function() {
			return peer;
		}
		
		this.adapt = function() {
			return peer.getHostFile();
		}
	}

	this.getBasename = getBasename;
	$api.deprecate(this, "getBasename");

	this.getParent = getParent;
	$api.deprecate(this, "getParent");
	
	this.getFile = getFile;
	$api.deprecate(this, "getFile");
	
	this.getDirectory = getDirectory;
	$api.deprecate(this, "getDirectory");

	this.writeBinary = function() {
		var args = [Streams.binary];
		for (var i=0; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		return write.apply(null,args);
	};
	this.writeText = function() {
		var args = [Streams.text];
		for (var i=0; i<arguments.length; i++) {
			args.push(arguments[i]);
		}
		return write.apply(null,args);
	};
	$api.deprecate(this, "writeBinary");
	$api.deprecate(this, "writeText");

	this.__defineGetter__("$peer", function() {
		return peer;
	});
	this.__defineGetter__("$filesystem", function() {
		return $filesystem;
	});
	this.$getPeer = function() {
		return peer;
	};
	this.$getFilesystem = function() {
		return $filesystem;
	};
	this.$inFilesystem = function(filesystem) {
		return filesystem.$system.$inFilesystem(this);
	}
	$api.deprecate(this, "$peer");
	$api.deprecate(this, "$filesystem");
	$api.deprecate(this, "$getPeer");
	$api.deprecate(this, "$getFilesystem");
	$api.deprecate(this, "$inFilesystem");
	
	var Node = function(pathname,prefix) {
		this.toString = function() {
			return pathname.toString();
		}

		var getPathname = function() {
			return pathname;
		}

		this.__defineGetter__("pathname", getPathname);

		var getParent = function() {
			if (pathname.parent == null) return null;
			return pathname.parent.directory;
		}

		this.__defineGetter__("parent", getParent);

		var getLastModified = function() {
			return $filesystem.getLastModified(peer);
		}

		var setLastModified = function(date) {
			$filesystem.setLastModified(peer,date);
		}

		this.__defineGetter__("modified", getLastModified);
		this.__defineSetter__("modified", setLastModified);

		var getRelativePath = function(pathString) {
			var directoryPath = pathname.toString() + prefix;
			if (directoryPath.length > 0 && directoryPath.substring( directoryPath.length - 1 ) != $filesystem.PATHNAME_SEPARATOR)
				directoryPath += $filesystem.PATHNAME_SEPARATOR;
			return $filesystem.newPathname( directoryPath + pathString );
		}
		this.getRelativePath = getRelativePath;

		this.remove = function() {
			//	TODO	Should probably invalidate this object somehow
			//	TODO	Should this return a value of some kind?
			$filesystem.remove(peer);
		}

		this.getPathname = getPathname;
		$api.deprecate(this, "getPathname");
		this.getParent = getParent;
		$api.deprecate(this, "getParent");
		this.setLastModified = setLastModified;
		this.getLastModified = getLastModified;
		$api.deprecate(this, "getLastModified");
		$api.deprecate(this, "setLastModified");
	}

	var File = function(pathname,peer) {
		Node.call(this,pathname,$filesystem.PATHNAME_SEPARATOR + ".." + $filesystem.PATHNAME_SEPARATOR);

		this.directory = false;

		var resource = new $context.Resource({
			read: {
				binary: function() {
					return $filesystem.read.binary(peer);
				},
				text: function() {
					return $filesystem.read.character(peer);
				}
			}
		});

		this.resource = resource;

		this.read = function(mode) {
			return resource.read(mode);
		}

		this.readLines = function() {
			return resource.read.lines.apply(resource,arguments);
		}
	}
//	File.prototype = new Node(this,$filesystem.PATHNAME_SEPARATOR + ".." + $filesystem.PATHNAME_SEPARATOR);

	var Directory = function(pathname,peer) {
		Node.call(this,pathname,"");

		this.directory = true;

		this.getFile = function(name) {
			return $filesystem.newPathname( this.getRelativePath(name).toString() ).file;
		}

		this.getSubdirectory = function(name) {
			if (!name) throw new TypeError("Missing: subdirectory name.");
			return $filesystem.newPathname( this.getRelativePath(name).toString() ).directory;
		}

		var toFilter = function(regexp) {
			return function(item) {
				return regexp.test(item.pathname.basename);
			}
		}

		var self = this;

		var list = function(mode) {
			if (!mode) mode = {};
			var filter = mode.filter;
			if (filter instanceof RegExp) {
				filter = toFilter(filter);
			}
			if (!filter) filter = function() { return true; }

			var type = (mode.type == null) ? arguments.callee.NODE : mode.type;
			var toReturn = function(rv) {
				var map = function(node) {
					return type.create(self,node);
				};

				if (type.filter) {
					rv = rv.filter(type.filter);
				}

				return rv.map(map);
			};

			var rv;
			if (mode.recursive) {
				rv = [];
				var add = function(dir) {
					var items = dir.list();
					items.forEach( function(item) {
						if (filter(item)) {
							rv.push(item);
							if (item.directory) {
								add(item.pathname.directory);
							}
						}
					} );
				}

				add(this);

				return toReturn(rv);
			} else {
				var createNodesFromPeers = function(peers) {
					//	This function is written with this kind of for loop to allow accessing a Java array directly
					//	It also uses an optimization, using the peer's directory property if it has one, which a peer would not be
					//	required to have
					var rv = [];
					for (var i=0; i<peers.length; i++) {
						var pathname = new Pathname( { filesystem: $filesystem, peer: peers[i] } );
						var directory = defined(peers[i].directory, Boolean(pathname.directory));
						if (directory) {
							rv.push(pathname.directory);
						} else {
							rv.push(pathname.file);
						}
					}
					return rv;
				}
				var peers = $filesystem.list(peer);
				rv = createNodesFromPeers(peers);
				rv = rv.filter( filter );
				return toReturn(rv);
			}
		}

		this.list = list;
		this.list.NODE = {
			create: function(d,n) {
				return n;
			}
		};
		this.list.ENTRY = {
			create: function(d,n) {
				return {
					path: n.toString().substring(d.toString().length),
					node: n
				}
			}
		};
		this.list.RESOURCE = {
			filter: function(n) {
				return !n.directory
			},
			create: function(d,n) {
				return {
					path: n.toString().substring(d.toString().length).replace(/\\/g, "/"),
					resource: n.resource
				}
			}
		}

		if ($filesystem.temporary) {
			this.createTemporary = function(parameters) {
				return $filesystem.temporary(peer,parameters);
			}
			$context.experimental(this,"createTemporary");
		}
	}
//	Directory.prototype = new Node(this,"");
}

var Searchpath = function(parameters) {
	if (this.constructor != arguments.callee) {
		//	not called as constructor but as function
		//	perform a "cast"
		if (parameters instanceof Array) {
			return defaults.filesystem.Searchpath(parameters);
		} else {
			throw new TypeError("Illegal argument to Searchpath(): " + parameters);
		}
	}

	if (!parameters || !parameters.array) {
		throw new TypeError("Illegal argument to new Searchpath(): " + parameters);
	}

	var array = parameters.array.slice(0);
	var filesystem = parameters.filesystem;

	this.append = function(pathname) {
		//	TODO	Check to make sure pathname filesystem matches filesystem?
		array.push(pathname);
	}
	$api.deprecate(this, "append");

	var getPathnames = function() {
		return array;
	}
	this.__defineGetter__("pathnames", getPathnames);
	
	this.getPathnames = getPathnames;
	$api.deprecate(this, "getPathnames");

	this.toString = function() {
		return getPathnames().map( function(pathname) {
			if (filesystem.$Searchpath && filesystem.$Searchpath.mapPathname) {
				pathname = filesystem.$Searchpath.mapPathname(pathname);
			}
			return pathname.toString();
		} ).join(filesystem.SEARCHPATH_SEPARATOR);
	}
}
Searchpath.createEmpty = function() {
	return Searchpath([]);
}

$exports.Searchpath = Searchpath;
$exports.Pathname = Pathname;
