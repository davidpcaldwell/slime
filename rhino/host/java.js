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

var scope = this;
var $export = function(name,value) {
	var exists = function(s) {
		if (scope[s]) return true;
		return false;
	}

	if (exists("$exports")) {
		$exports[name] = value;
	}
}

var warning = $context.warning;

var isJavaObject = function(object) {
	if (typeof(object) == "undefined") return false;
	if (typeof(object) == "string") return false;
	if (typeof(object) == "number") return false;
	if (typeof(object) == "boolean") return false;
	if (object == null) return false;
	//	TODO	Is the next line superfluous now?
	if ( Packages.java.lang.reflect.Array.newInstance(Packages.java.lang.Object, 0).getClass().isInstance(object) ) return true;
	//	TODO	is this really the best way to do this?
	return (String(object.getClass) == "function getClass() {/*\njava.lang.Class getClass()\n*/}\n");
}
$exports.isJavaObject = isJavaObject;

//	TODO	Document these three, when it is clear how to represent host objects in the documentation; or we provide native
//	script objects to wrap Java classes, which may be a better approach
var getJavaClass = function(object) {
	return Packages[object["class"].name];
}

var toJsArray = function(javaArray,scriptValueFactory) {
	if (typeof(javaArray) == "undefined" || javaArray == null) throw "Required: the Java array must not be null or undefined.";
	if (typeof(scriptValueFactory) == "undefined" || scriptValueFactory == null)
		throw "Required: the function to convert Java objects to ECMAScript objects must not be null or undefined.";
	var rv = new Array(javaArray.length);
	for (var i=0; i<javaArray.length; i++) {
		rv[i] = scriptValueFactory(javaArray[i]);
	}
	return rv;
}
$exports.toJsArray = toJsArray;

var toJavaArray = function(jsArray,javaclass,adapter) {
	if (!adapter) adapter = function(x) { return x; }
	var rv = Packages.java.lang.reflect.Array.newInstance(javaclass,jsArray.length);
	for (var i=0; i<jsArray.length; i++) {
		rv[i] = adapter(jsArray[i]);
	}
	return rv;
}
$exports.toJavaArray = toJavaArray;

var deprecate;
if (!deprecate) {
	//	TODO	We need a default implementation for the moment because jsunit needs one; the jsunit scripts should provide one,
	//			though, and this should be removed.
	deprecate = function() {
	}
}

Array.java = {};
//	TODO	Review whether having the second argument be required makes sense
Array.java.toScript = toJsArray;
deprecate(Array, "java");

Array.prototype.toJava = function(javaclass) {
	return toJavaArray(this,javaclass);
}

deprecate(Array.prototype, "toJava");

//	TODO	Below seems to be some kind of elaborate error-handling attempt; it merits examination at some point
//var execute = function(pathname) {
//	try {
//		jsh.execute(scope,pathname);
//	} catch (e) {
//		scope.$jsunit.success = false;
//		var context = Packages.org.mozilla.javascript.Context.getCurrentContext();
//		var errors = Packages.inonit.script.rhino.Engine.Errors.get(context);
//		var array = errors.getErrors();
//		var printedSomething = false;
//		for (var i=0; i<array.length; i++) {
//			var boilerplate = function(error) {
//				if (String(error.getMessage()).indexOf("Compilation produced") == 0) {
//					return true;
//				}
//				return false;
//			}
//			var error = array[i];
//			if (!boilerplate(error)) {
//				Packages.java.lang.System.err.println(
//					error.getSourceName()
//					+ ":" + error.getLineNumber()
//					+ ": " + error.getMessage()
//					+ "\n" + error.getLineSource()
//				);
//				printedSomething = true;
//			}
//		}
//		if (!printedSomething) {
//			Packages.java.lang.System.err.println(e);
//			for (var x in e) {
//				Packages.java.lang.System.err.println("e[" + x + "] = " + e[x]);
//			}
//		}
//		throw "Compilation errors in " + pathname;
//	}
//}