//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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

	$exports.pathname = $context.script.pathname;
	$api.deprecate($exports,"pathname");
	$exports.getRelativePath = function(path) {
		return $exports.file.getRelativePath(path);
	}
	$api.deprecate($exports,"getRelativePath");
} else {
	debugger;
}
$exports.arguments = $context.arguments;
$exports.addClasses = $api.deprecate($context.api.addClasses);

	//	TODO	should jsh.script.loader support some sort of path structure?
$exports.Loader = $context.Loader;

if ($context.loader) {
	$exports.loader = $context.loader;
} else if ($context.script) {
	$exports.loader = new $exports.Loader($exports.pathname.parent);
}

$exports.getopts = $loader.file("getopts.js", {
	$arguments: $exports.arguments,
	$filesystem: $context.api.file.filesystem,
	$workingDirectory: $context.api.file.workingDirectory,
	$Pathname: $context.api.file.Pathname
}).getopts;