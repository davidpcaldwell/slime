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
$exports.addClasses = $api.deprecate($context.api.addClasses);

$exports.Loader = function(paths) {
	//	TODO	do we also need the analog of loader.run()?
	this.file = function(path) {
		var args = [ paths.file(path) ];
		for (var i=1; i<arguments.length; i++) {
			args[i] = arguments[i];
		}
		return jsh.loader.file.apply(jsh.loader,args);
	}

	this.module = function(path) {
		var args = [ paths.module(path) ];
		for (var i=1; i<arguments.length; i++) {
			args[i] = arguments[i];
		}
		return jsh.loader.module.apply(jsh.loader,args);
	}
}
$exports.Loader.Paths = function(base) {
	this.file = function(path) {
		return base.getRelativePath(path);
	}

	this.module = function(path) {
		return base.getRelativePath(path);
	}
}
$exports.Loader.SlimeDirectory = function(dir) {
	return function(path) {
		return dir.getRelativePath(path.substring(0,path.length-1).replace(/\//g,".") + ".slime")
	}
}
$api.experimental($exports,"Loader");

$exports.getopts = $loader.file("getopts.js", {
	$arguments: $exports.arguments,
	$filesystem: $context.api.file.filesystem,
	$workingDirectory: $context.api.file.workingDirectory,
	$Pathname: $context.api.file.Pathname
}).getopts;