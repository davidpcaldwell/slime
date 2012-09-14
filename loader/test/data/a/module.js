//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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