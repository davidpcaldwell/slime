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

//	TODO	document this
var stdio = ($context.stdio) ? $context.stdio : {
	$err: Packages.java.lang.System.err,
	$out: Packages.java.lang.System.out
}

var warning = function(message) {
	stdio.$err.println(message);
	debugger;
}

var globals = {};
var defaults = {};

if (!$context.api) throw "Missing 'api' member of context";
var streams = $context.api.io;
$exports.Streams = streams.Streams;
$api.deprecate($exports,"Streams");

var os = $loader.script("os.js", new function() {
	this.$pwd = $context.$pwd;
	this.cygwin = $context.cygwin;
	this.streams = streams;
	this.deprecate = $api.deprecate;
	this.isJavaType = $context.api.java.isJavaType;
	this.defined = $context.api.js.defined;

	//	These next three methods are defined this way because of dependencies on filesystem.js: presumably these are
	//	cross-dependencies
	this.__defineGetter__("Searchpath", function() {
		return globals.Searchpath;
	});
	this.__defineGetter__("Pathname", function() {
		return globals.Pathname;
	});
	this.__defineGetter__("addFinalizer", function() {
		return globals.addFinalizer;
	});
});

$exports.filesystems = os.filesystems;

//	Possibly used for initial attempt to produce HTTP filesystem, for example
$exports.Filesystem = os.Filesystem;
$api.experimental($exports,"Filesystem");

//	By policy, default filesystem is cygwin filesystem if it is present.  Default can be set through module's filesystem property
defaults.filesystem = (os.filesystems.cygwin) ? os.filesystems.cygwin : os.filesystems.os;

var workingDirectory = function() {
	if ($context.$pwd) {
		var osdir = os.filesystems.os.Pathname($context.$pwd);
		if (defaults.filesystem == os.filesystems.cygwin) {
			osdir = os.filesystems.cygwin.toUnix(osdir);
		}
		return osdir.directory;
	}
};
$exports.__defineGetter__("workingDirectory", workingDirectory);

//	TODO	figure out how to make this work properly
$exports.__defineGetter__("filesystem", function() {
	return defaults.filesystem;
});
$exports.__defineSetter__("filesystem", function(v) {
	defaults.filesystem = v;
});

var filesystem = $loader.script("filesystem.js", {
	defined: $context.api.js.defined,
	defaults: defaults,
	constant: $context.api.js.constant,
	deprecate: $api.deprecate,
	experimental: $api.experimental,
	fail: $context.api.java.fail,
	Streams: streams.Streams,
	warning: warning,
	Resource: streams.Resource
});

globals.Pathname = filesystem.Pathname;
globals.Searchpath = filesystem.Searchpath;
globals.addFinalizer = filesystem.addFinalizer;

$exports.Pathname = filesystem.Pathname;
$exports.Searchpath = filesystem.Searchpath;

$exports.java = $context.api.io.java;
$api.deprecate($exports,"java");

var zip = $loader.script("zip.js", {
	Streams: streams.Streams,
	Pathname: filesystem.Pathname
});

$exports.zip = zip.zip;
$api.experimental($exports, "zip");
debugger;
