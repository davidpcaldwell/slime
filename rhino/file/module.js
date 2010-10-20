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

if (!$context.api) throw "Missing 'api' member of context";
//	TODO	remove
var $load = function(context,path) {
	return $loader.script(path,context);
};
var loadTo = function(to,context,name) {
	var getter = function(name) {
		return function() {
			return loaded[name];
		}
	};
	var setter = function(name) {
		return function(v) {
			loaded[name] = v;
		}
	};
	var loaded = $load(context,name);
	for (var x in loaded) {
		if (loaded.__lookupGetter__(x)) {
			to.__defineGetter__(x, getter(x));
			to.__defineSetter__(x, setter(x));
		} else {
			to[x] = loaded[x];
		}
	}
};

var streams = $loader.script("streams.js", {
	stdio: stdio,
	isJavaType: $context.api.java.isJavaType,
	api: {
		js: $context.api.js,
		java: $context.api.java
	},
	deprecate: $context.api.js.deprecate,
	$java: new Packages.inonit.script.runtime.io.Streams()
});
$exports.Streams = streams.Streams;

var context = {
	deprecate: $api.deprecate,
	experimental: $api.experimental,
	defined: $context.api.js.defined,
	fail: $context.api.java.fail,
	warning: function(message) {
		stdio.$err.println(message);
		debugger;
	},
	constant: $context.api.js.constant,
	isJavaType: $context.api.java.isJavaType,

	$pwd: $context.$pwd,
	cygwin: $context.cygwin,

	streams: streams,
	Streams: streams.Streams
}

var scope = {};
loadTo(scope, context, "os.js");
context.defaults = scope.defaults;
loadTo(scope, context, "filesystem.js");
context.Pathname = scope.Pathname;
context.Searchpath = scope.Searchpath;

var zip = $load({
	Streams: streams.Streams,
	Pathname: scope.Pathname
}, "zip.js");

var exportProperty = function(name) {
	$exports.__defineGetter__(name, function() {
		return scope[name];
	});
	$exports.__defineSetter__(name, function(v) {
		scope[name] = v;
	});
}
exportProperty("cygwin");
$api.deprecate($exports,"cygwin");

exportProperty("filesystems");
$exports.__defineGetter__("filesystem", function() {
	return scope.defaults.filesystem;
});
$exports.__defineSetter__("filesystem", function(v) {
	scope.defaults.filesystem = v;
});

$exports.warning = scope.warning;
$api.deprecate($exports, "warning");

$exports.Pathname = scope.Pathname;
$exports.Searchpath = scope.Searchpath;
exportProperty("workingDirectory");

$exports.Filesystem = scope.Filesystem;
//	Possibly used for initial attempt to produce HTTP filesystem, for example
$api.experimental($exports,"Filesystem");

$exports.java = new function() {
	this.adapt = function(object) {
		if (false) {
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.InputStream)(object)) {
			return new streams.InputStream(object);
		} else if ($context.api.java.isJavaObject(object) && $context.api.java.isJavaType(Packages.java.io.OutputStream)(object)) {
			return new streams.OutputStream(object);
		} else {
			throw "Unimplemented: " + object;
		}
	}
}

$exports.$java = $exports.java;
$api.deprecate($exports,"$java");

if (!$exports.warning) {
	$exports.warning = function(message) {
		debugger;
		err.println(message);
	}
}
$api.deprecate($exports,"warning");

$exports.zip = zip.zip;
$api.experimental($exports, "zip");

$exports.$script = new function() {
	this.setFilesystem = function(fs) {
		scope.filesystem = fs;
	}
	$api.deprecate(this, "setFilesystem");
	this.peers = new function() {
		this.Reader = streams.Reader;
		$api.deprecate(this, "Reader");
		this.Writer = streams.Writer;
		$api.deprecate(this, "Writer");
	}
	this.__defineGetter__("filesystem", function() {
		return scope.filesystem;
	});
	$api.deprecate(this,"filesystem");
}
$api.deprecate($exports,"$script");
