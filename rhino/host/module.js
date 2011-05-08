//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/host SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var warning = ($context.warning) ? $context.warning : function(s) {
	debugger;
	Packages.java.lang.System.err.println("rhino/host WARNING: " + s);
};

var items = $loader.script("java.js", {
	classLoader: $context.classLoader,
	warning: (function() {
		if ($context.warning) return $context.warning;
		return function(message) {
			debugger;
			Packages.java.lang.System.err.println(message);
		}
	})()
});
$exports.isJavaObject = items.isJavaObject;
$exports.toJsArray = items.toJsArray;

$exports.Properties = new function() {
	this.adapt = function($properties) {
		return Packages.inonit.script.runtime.Properties.create($properties);
	}
}
$api.experimental($exports,"Properties");

$exports.fail = function(message) {
	//	TODO	Bundle this with the module rather than the shell as a whole
	if (typeof(Packages.inonit.script.runtime.Throwables.INSTANCE.fail) == "function") {
		Packages.inonit.script.runtime.Throwables.INSTANCE.fail(message);
	} else {
		throw message;
	}
}

$api.experimental($exports,"fail");

var experimental = function(name) {
	$exports[name] = items[name];
	$api.experimental($exports, name);
}

var getJavaClassName = function(javaclass) {
	var toString = "" + javaclass;
	if (/\[JavaClass /.test(toString)) {
		return toString.substring("[JavaClass ".length, toString.length-1);
	} else {
		return null;
	}
}

var $isJavaType = function(javaclass,object) {
	var getNamedJavaClass = function(className) {
		var classLoader = ($context.classLoader) ? $context.classLoader : Packages.java.lang.Class.forName("java.lang.Object").getClassLoader();
		if (classLoader) {
			return classLoader.loadClass(className);
		} else {
			return Packages.java.lang.Class.forName(className);
		}
	};

	var className = getJavaClassName(javaclass);
	if (className == null) throw "Not a class: " + javaclass;
	if (!items.isJavaObject(object)) return false;
	var loaded = getNamedJavaClass(className);
	return loaded.isInstance(object);
}
$exports.isJavaType = function(javaclass) {
	if (arguments.length == 2) {
		warning("WARNING: Use of deprecated 2-argument form of isJavaType.");
		return $isJavaType(javaclass,arguments[1]);
	}
	return function(object) {
		return $isJavaType(javaclass,object);
	}
};
$api.experimental($exports,"isJavaType");
experimental("toJavaArray");

$exports.Thread = {};
$exports.Thread.thisSynchronize = function(f) {
	//	TODO	deprecate when Rhino 1.7R3 released; use two-argument version of the Synchronizer constructor in a new method called
	//			synchronize()
	return new Packages.org.mozilla.javascript.Synchronizer(f);
}