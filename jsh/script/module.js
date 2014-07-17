//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if ($context.script) {
	$exports.file = $context.script;
	$exports.script = $context.script;

	$exports.pathname = $context.script.pathname;
	$api.deprecate($exports,"pathname");
	$exports.getRelativePath = function(path) {
		return $exports.file.getRelativePath(path);
	}
	$api.deprecate($exports,"getRelativePath");
} else if ($context.packaged) {
	$exports.file = $context.packaged;
} else if ($context.uri) {
	$exports.url = $context.uri;
} else {
//	throw new Error("Unreachable.");
}
$exports.arguments = $context.arguments;
$exports.addClasses = $api.deprecate($context.api.addClasses);

$exports.Loader = $api.deprecate($context.api.file.Loader);

//	TODO	should jsh.script.loader support some sort of path structure?
if ($context.loader) {
	$exports.loader = $context.loader;
} else if ($context.script) {
	$exports.loader = new $context.api.file.Loader($exports.file.parent);
} else if ($context.uri) {
	$exports.__defineGetter__("loader", $context.api.js.constant(function() {
		var http = $context.api.http();
		var client = new http.Client();
		var base = $context.uri.split("/").slice(0,-1).join("/") + "/";
		if (!client) throw new Error("client is null");
		return new client.Loader(base);
	}));
}

$exports.getopts = $loader.file("getopts.js", {
	$arguments: $exports.arguments,
	$filesystem: $context.api.file.filesystem,
	$workingDirectory: $context.workingDirectory,
	$Pathname: $context.api.file.Pathname
}).getopts;

$exports.Application = $loader.file("Application.js", {
	js: $context.api.js,
	getopts: $exports.getopts
}).Application;

