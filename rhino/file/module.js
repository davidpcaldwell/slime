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

if (!$context.api) throw new Error("Missing 'api' member of context");
if ($context.$pwd && typeof($context.$pwd) != "string") {
	throw new Error("$pwd is object.");
}

var isPathname = function(item) {
	return item && item.java && item.java.adapt() && $context.api.java.isJavaType(Packages.java.io.File)(item.java.adapt());
}

var prototypes = {
	Searchpath: {}
};

var file = $loader.file("file.js", {
	pathext: $context.pathext,
	isPathname: isPathname,
	defined: $context.api.js.defined,
	constant: $context.api.js.constant,
	fail: $context.api.java.fail,
	isJavaType: $context.api.java.isJavaType,
	Streams: $context.api.io.Streams,
	Resource: $context.api.io.Resource
});
file.Searchpath.prototype = prototypes.Searchpath;

var spi = $loader.file("spi.js", {
	Searchpath: file.Searchpath
});

//	TODO	separate out Cygwin and make it less tightly bound with the rest of this
var os = $loader.file("os.js", new function() {
	this.Filesystem = spi.Filesystem;
	
	this.cygwin = $context.cygwin;

	this.api = new function() {
		this.io = $context.api.io;
		this.isJavaType = $context.api.java.isJavaType;
		this.defined = $context.api.js.defined;
	};

	this.Searchpath = file.Searchpath;
	this.Pathname = file.Pathname;
	this.isPathname = isPathname;

	this.addFinalizer = $context.addFinalizer;
});

//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through module's filesystem property
$exports.filesystem = (os.filesystems.cygwin) ? os.filesystems.cygwin : os.filesystems.os;

$exports.filesystems = os.filesystems;

//	TODO	perhaps should move selection of default filesystem into these definitions rather than inside file.js
$exports.Pathname = function(parameters) {
	if (this.constructor != arguments.callee) {
		var ctor = arguments.callee;

		var decorator = function(rv) {
			rv.constructor = ctor;
			return rv;
		}

		//	not called as constructor but as function
		//	perform a "cast"
		if (typeof(parameters) == "string") {
			return decorator($exports.filesystem.Pathname(parameters));
		} else if (typeof(parameters) == "object" && parameters instanceof String) {
			return decorator($exports.filesystem.Pathname(parameters.toString()));
		} else {
			$context.api.java.fail("Illegal argument to Pathname(): " + parameters);
		}
	} else {
		$context.api.java.fail("Cannot invoke Pathname as constructor.");
	}
};
//	TODO	Searchpath implementation has multiple layers: in os.js, file.js, here ... consolidate and refactor
$exports.Searchpath = function(parameters) {
	if (this.constructor != arguments.callee) {
		if (parameters instanceof Array) {
			return $exports.filesystem.Searchpath(parameters);
		} else {
			throw new TypeError("Illegal argument to Searchpath(): " + parameters);
		}
	} else {
		throw new Error("Cannot invoke Searchpath as constructor.");
	}
};
$exports.Searchpath.createEmpty = function() {
	return $exports.Searchpath([]);
}
$api.deprecate($exports.Searchpath,"createEmpty");
$exports.Searchpath.prototype = prototypes.Searchpath;

//	TODO	this implementation would be much simpler if we could use a normal loader/rhino loader with a _source, but
//			right now this would cause Cygwin loaders to fail, probably
$exports.Loader = function(p) {
	if (arguments.length == 1 && arguments[0].pathname && arguments[0].directory) {
		p = {
			directory: arguments[0],
		};
	};
	if (!p.type) {
		p.type = function(file) {
			return $context.api.io.mime.Type.guess({ name: file.pathname.basename });
		};
	}
	return new $context.api.io.Loader({
		resources: new function() {
			this.toString = function() {
				return "rhino/file Loader: directory=" + p.directory;
			}

			this.get = function(path) {
				var file = p.directory.getFile(path);
				//	TODO	could we modify this so that file supported Resource?
				if (file) {
					return new $context.api.io.Resource({
						type: p.type(file),
						read: {
							binary: function() {
								return file.read(jsh.io.Streams.binary);
							}
						}
					});
				}
				return null;
			}
		}
	});
};

//	Possibly used for initial attempt to produce HTTP filesystem, for example
$exports.Filesystem = os.Filesystem;
$api.experimental($exports,"Filesystem");

var zip = $loader.file("zip.js", {
	Streams: $context.api.io.Streams
	,Pathname: file.Pathname
	,InputStream: function(_in) {
		return $context.api.io.java.adapt(_in)
	}
});

$exports.zip = zip.zip;
$exports.unzip = zip.unzip;
$api.experimental($exports, "zip");
$api.experimental($exports, "unzip");

//	TODO	probably does not need to use __defineGetter__ but can use function literal?
var workingDirectory = function() {
	//	TODO	the call used by jsh.shell to translate native paths to paths from this package can probably be used here
	if ($context.$pwd) {
		var osdir = os.filesystems.os.Pathname($context.$pwd);
		if ($exports.filesystem == os.filesystems.cygwin) {
			osdir = os.filesystems.cygwin.toUnix(osdir);
		}
		return osdir.directory;
	}
};
$exports.__defineGetter__("workingDirectory", workingDirectory);
//	Property only makes sense in context of an execution environment, so moving to jsh.shell (other environments can provide their
//	own mechanisms)
$api.deprecate($exports,"workingDirectory");

$exports.Streams = $context.api.io.Streams;
$api.deprecate($exports,"Streams");
$exports.java = $context.api.io.java;
$api.deprecate($exports,"java");
