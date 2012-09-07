//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (typeof($context.d) == "undefined") {
	debugger;
	throw "$context.d is undefined";
}

var file = $loader.file("file.js", {$debug: $context.debug, b: 4});

var runScope = new function() {
	this.e = 2;

	var result;

	this.set = function(x) {
		result = x;
	}

	this.result = function() {
		return result;
	}
};

var runThis = {};

$loader.run("run.js",runScope,runThis);

$exports.a = file.a;
$exports.b = file.b;
$exports.c = file.c;
$exports.d = $context.d;
$exports.e = runScope.result();
$exports.f = runThis.f;