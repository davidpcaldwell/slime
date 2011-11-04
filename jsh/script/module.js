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

if ($context.$script) {
	$exports.pathname = $context.api.file.filesystem.$jsh.Pathname($context.$script);
	$exports.file = $exports.pathname.file;
	$exports.getRelativePath = function(path) {
		return $exports.file.getRelativePath(path);
	}
}
$exports.arguments = $context.api.java.toJsArray($context.$arguments, function(s) { return String(s); });
$exports.addClasses = function(pathname) {
	if (!pathname.directory && !pathname.file) {
		throw "Classes not found: " + pathname;
	}
	$context.addClasses(pathname);
}

$exports.getopts = $loader.file("getopts.js", {
	$arguments: $exports.arguments,
	$filesystem: $context.api.file.filesystem,
	$workingDirectory: $context.api.file.workingDirectory,
	$Pathname: $context.api.file.Pathname
}).getopts;
