//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (typeof($context.d) == "undefined") {
	debugger;
	throw new Error("$context.d is undefined");
}

var fThis = { description: "fThis" };
var file = $loader.file("file.js", {$debug: $context.debug, b: 4}, fThis);
var mThis = { description: "mThis" };
var module = $loader.module("file.js", {$debug: $context.debug, b: 4}, mThis);

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
var vThis = { description: "vThis" };
var value = $loader.value("value.js", {b: 4}, vThis);

$exports.a = file.a;
$exports.b = file.b;
$exports.c = file.c;
$exports.d = $context.d;
$exports.e = runScope.result();
$exports.f = runThis.f;
$exports.fThis = file.thisName;
$exports.mThis = module.thisName;
$exports.vThis = vThis;
$exports.value = value;
