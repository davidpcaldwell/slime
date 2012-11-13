//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
} else {
	throw new Error("Unreachable.");
}
$exports.arguments = $context.arguments;
$exports.addClasses = $api.deprecate($context.api.addClasses);

	//	TODO	should jsh.script.loader support some sort of path structure?
$exports.Loader = $context.Loader;

if ($context.loader) {
	$exports.loader = $context.loader;
} else if ($context.script) {
	$exports.loader = new $exports.Loader($exports.file.parent);
}

$exports.getopts = $loader.file("getopts.js", {
	$arguments: $exports.arguments,
	$filesystem: $context.api.file.filesystem,
	$workingDirectory: $context.workingDirectory,
	$Pathname: $context.api.file.Pathname
}).getopts;
