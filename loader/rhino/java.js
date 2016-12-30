//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.toNativeClass = $context.engine.toNativeClass;

$exports.getClass = function(name) {
	$api.Function.argument.isString({ index: 0, name: "name" }).apply(this,arguments);
	if ($context.classpath.getClass(name)) {
		return $context.engine.getJavaClass(name);
	}
	return null;
};

var isJavaObject = function(object) {
	if (typeof(object) == "undefined") return false;
	if (typeof(object) == "string") return false;
	if (typeof(object) == "number") return false;
	if (typeof(object) == "boolean") return false;
	if (object === null) return false;
	if ($context.engine.isNativeJavaObject(object)) return true;
	return false;
}
$exports.isJavaObject = isJavaObject;

//	Used by io.js
$exports.isJavaType = function(javaclass) {
	if (arguments.length != 1) throw new Error("isJavaType takes one argument.");
	return function isSpecificJavaType(object) {
		if (!isJavaObject(object)) return false;
		var loaded = $context.engine.toNativeClass(javaclass);
		return loaded.isInstance(object);
	}
};

$exports.test = $context.engine.test;
