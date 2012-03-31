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

if (!$context.api) throw "Missing 'api' member of context";

var defaults = {};

var file = $loader.file("file.js", {
	defined: $context.api.js.defined,
	defaults: defaults,
	constant: $context.api.js.constant,
	fail: $context.api.java.fail,
	Streams: $context.api.io.Streams,
	Resource: $context.api.io.Resource
});

//	TODO	separate out Cygwin and make it less tightly bound with the rest of this
var os = $loader.file("os.js", new function() {
	this.cygwin = $context.cygwin;

	this.api = new function() {
		this.io = $context.api.io;
		this.isJavaType = $context.api.java.isJavaType;
		this.defined = $context.api.js.defined;
	};

	this.Searchpath = file.Searchpath;
	this.Pathname = file.Pathname;

	this.addFinalizer = $context.addFinalizer;
});

//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through module's filesystem property
defaults.filesystem = (os.filesystems.cygwin) ? os.filesystems.cygwin : os.filesystems.os;

//	TODO	figure out how to make this work properly
$exports.__defineGetter__("filesystem", function() {
	return defaults.filesystem;
});
$exports.__defineSetter__("filesystem", function(v) {
	defaults.filesystem = v;
});

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
			return decorator(defaults.filesystem.Pathname(parameters));
		} else if (typeof(parameters) == "object" && parameters instanceof String) {
			return decorator(defaults.filesystem.Pathname(parameters.toString()));
		} else {
			$context.api.java.fail("Illegal argument to Pathname(): " + parameters);
		}
	} else {
		$context.api.java.fail("Cannot invoke Pathname as constructor.");
	}
};
$exports.Searchpath = file.Searchpath;

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
		if (defaults.filesystem == os.filesystems.cygwin) {
			osdir = os.filesystems.cygwin.toUnix(osdir);
		}
		return osdir.directory;
	}
};
$exports.__defineGetter__("workingDirectory", workingDirectory);

$exports.Streams = $context.api.io.Streams;
$api.deprecate($exports,"Streams");
$exports.java = $context.api.io.java;
$api.deprecate($exports,"java");
