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

var javaLangObjectArrayClass;

var isJavaObjectArray = function(v) {
	//	TODO	In Nashorn, this could be: Java.type("java.lang.Object[]").class;
	if (!javaLangObjectArrayClass) javaLangObjectArrayClass = Packages.java.lang.reflect.Array.newInstance($context.engine.toNativeJavaClass(Packages.java.lang.Object), 0).getClass();
	return javaLangObjectArrayClass.isInstance(v);
};

$exports.toNativeJavaClass = $context.engine.toNativeJavaClass;

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
	if (object == null) return false;
	//	TODO	Is the next line superfluous now?
	if (isJavaObjectArray(object)) return true;
	if ($context.engine.isNativeJavaObject(object)) return true;
	return false;
}
$exports.isJavaObject = isJavaObject;

//	Used by io.js
$exports.isJavaType = function(javaclass) {
	if (arguments.length != 1) throw new Error("isJavaType takes one argument.");
	return function isSpecificJavaType(object) {
		if (!isJavaObject(object)) return false;
		var loaded = $context.engine.toNativeJavaClass(javaclass);
		return loaded.isInstance(object);
	}
};

$exports.test = $context.engine.test;
