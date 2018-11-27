//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	Shared code for unit test harnesses

var assign = (function() {
	if ($context.api.assign) return $context.api.assign;
	if (Object.assign) return Object.assign;
	throw new Error();
})();

//	TODO	in-progress refactoring of ApiHtmlTests below may make this unneeded as a public variable
$exports.MEDIA_TYPE = "application/x.jsapi";

//	Returns a path for api.html given a path to a .js file or other file
$exports.getApiHtmlPath = function(path) {
	if (/\/$/.test(path)) {
		return path + "api.html";
	} else {
		var parsed = (function() {
			var tokens = path.split("/");
			if (tokens.length > 1) {
				return {
					dirname: tokens.slice(0,-1).join("/") + "/",
					basename: tokens[tokens.length-1]
				}
			} else {
				return {
					dirname: "",
					basename: path
				}
			}
		})();
		var jsName = /(.*)\.js$/.exec(parsed.basename);
		if (jsName) {
			return parsed.dirname + jsName[1] + ".api.html";
		} else {
			return parsed.dirname + parsed.basename +".api.html";
		}
	}
}

var run = function() {
	try {
		if (typeof($context) == "object" && $context.run) {
			$context.run(arguments[0],arguments[1]);
		} else {
			with(arguments[1]) {
				eval((function(zero) {
					if (typeof(zero) == "string") return zero;
					if (typeof(zero) == "object" && zero.string) return zero.string + "//# sourceURL=" + zero.name;
					throw new Error();
				})(arguments[0]));
			}
		}
	} catch (e) {
		//	TODO	perhaps should define a custom error type here? $api does not currently allow this, but js/object does, so
		//			should move that into $api
		//	TODO	in any case, this design is dubious; creating "cause" at all seems primarily designed to support Java
		//			exceptions; otherwise we could just add the 'code' property to the existing Error
		//	If this is primarily to support Java exceptions, we are relying on the coincidence that the 'message' property can be
		//	used to invoke Java getMessage(), and we should test it with Nashorn
		if (e.type) {
			e.code = arguments[0];
		}
		throw e;
//		if (!e.type) {
//			var error = new Error(e.message);
//			error.cause = e;
//			error.code = arguments[0];
//			throw error;
//		} else {
//			e.code = arguments[0];
//			throw e;
//		}
	}
}

var getDescendants = function(element) {
	var addChildren = function(list,children) {
		for (var i=0; i<children.length; i++) {
			list.push(children[i]);
			arguments.callee(list,children[i].getChildren());
		}
	};

	var rv = [];
	addChildren(rv,element.getChildren());
	return rv;
}

var getChildren = function(element) {
	var addChildren = function recurse(list,children) {
		for (var i=0; i<children.length; i++) {
			if (children[i].getJsapiAttribute("id")) {
				list.push(children[i]);
			} else {
				recurse(list, children[i].getChildren());
			}
		}
	};
	
	var rv = [];
	addChildren(rv,element.getChildren());
	return rv;
}

var filter = function(array,f) {
	var rv = [];
	for (var i=0; i<array.length; i++) {
		if (f(array[i])) {
			rv.push(array[i]);
		}
	}
	return rv;
}

var select = function(array,f) {
	var rv = filter(array,f);
	if (rv.length > 1) {
		throw new Error("Too many satisfy filter: " + f + " " + rv);
	}
	if (rv.length == 0) return null;
	return rv[0];
}

var getElement = function(root,path) {
	var tokens = path.split("/");
	var rv = root;
	
	var hasJsapiId = function(id) {
		var rv = function(e) {
			return e.getJsapiAttribute("id") == id;
		};
		rv.toString = function() {
			return "[element: jsapi:id=" + id + " tokens=" + tokens + "]";
		}
		return rv;
	}

	for (var i=0; i<tokens.length; i++) {
		rv = select(getChildren(rv), hasJsapiId(tokens[i]));
		if (rv == null) return null;
		// if (typeof(rv) == "undefined") {
		// 	return null;
		// } else if (rv === null) {
		// 	throw new Error("Could not locate element: path = " + path);
		// }
	}
	return rv;
};

//	Creates an object representing an api.html given its HTML and a 'name' used to name the top-level scenario; this object can:
//		.getContexts(scope): produce the list of contexts declared on the page
//		.getScenario(scope,unit): produce a unit.js/Scenario given a scope and a test path
//
$exports.ApiHtmlTests = function(html,name) {
	this.toString = function() {
		return "ApiHtmlTests: " + name;
	}

	//Packages.java.lang.System.err.println("Created html tests " + name + " with top " + html.top.toString().substring(0,1000));
	var jsapiReferenceFilter = function(element) {
		return element.getJsapiAttribute("reference") != null;
	}

	//	Cannot have reference at top level, currently

	var references = filter(getDescendants(html.top), jsapiReferenceFilter);

	var referenceScope = new function() {
		this.getApi = function(path) {
			var apipath = path;
			var otherhtml = html.load(path);
			var rv = new $exports.ApiHtmlTests(otherhtml,name+":"+path);
			rv.getElement = function(path) {
				var rv = getElement(otherhtml.top,path);
				if (rv == null) {
					throw new Error("Could not locate path " + path + " in " + apipath);
				}
//				if (!otherhtml.getRelativePath) throw new Error("html " + otherhtml + " does not have getRelativePath");
//				rv.getRelativePath = function(path) {
//					return otherhtml.getRelativePath(path);
//				}
				return rv;
			}
			return rv;
		}
	};
	for (var i=0; i<references.length; i++) {
		var reference = references[i].getJsapiAttribute("reference");
		var element = (function() {
			var rv;
			with(referenceScope) {
				rv = eval(reference);
			}
			return rv;
		}).call(this);
		references[i].replaceContentWithContentOf(element);
		if (!element.getRelativePath) {
			throw new Error("No getRelativePath: " + reference);
		}
		var was = references[i].getRelativePath;
		references[i].getRelativePath = element.getRelativePath;
		references[i].getRelativePath.was = was;
		//	TODO	is the next line necessary? If not, can also remove this call in the DOM/E4X implementations
		references[i].removeJsapiAttribute("reference");
	}

	var SCRIPT_TYPE_PREFIX = $exports.MEDIA_TYPE + "#";

	var getScriptFilter = function(type) {
		if (!type) {
			return function(node) {
				return node.localName == "script" && node.getAttribute("type") && node.getAttribute("type").substring(0,SCRIPT_TYPE_PREFIX.length) == SCRIPT_TYPE_PREFIX;
			};
		} else {
			return function(node) {
				return node.localName == "script" && node.getAttribute("type") == ($exports.MEDIA_TYPE + "#" + type);
			};
		}
	};

	var getScripts = function(element,type) {
		return filter(element.getChildren(),getScriptFilter(type));
	};

	var getDescendantScripts = function(element,type) {
		return filter(getDescendants(element),getScriptFilter(type));
	}

	var isNameDiv = function(element) {
		return element.localName == "div" && element.getAttribute("class") == "name";
	}

	var getShared = function(scope) {
		if (!scope) throw new Error("No scope");
		return new function() {
			var createTestScope = function() {
				var rv = {
					$platform: $platform,
					scope: scope
				};
				for (var i=0; i<arguments.length; i++) {
					for (var x in arguments[i]) {
						rv[x] = arguments[i][x];
					}
				}
				return rv;
			};

			var relativeScope = function(element) {
				var rv = scope.$relative(element.getRelativePath);
	//			debugger;
				if (scope.module) {
					rv.module = scope.module;
				}
				for (var x in scope) {
					if (scope[x] && !rv[x]) {
						rv[x] = scope[x];
					}
				}
				return rv;
			};

			var runInitializer = function(initializer) {
				try {
					run(initializer.getContentString(), createTestScope(relativeScope(initializer)));
				} catch (e) {
					var error = new Error("Error executing scenario initialization.");
					error.code = initializer.getContentString();
					error.cause = e;
					throw error;
				}
			};

			this.createTestScope = createTestScope;
			this.relativeScope = relativeScope;
			this.runInitializer = runInitializer;
		}
	}

	var someAreTests = function(element) {
		var areTests = function(script) {
			return script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "initialize")
				|| script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "tests")
				|| script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "destroy")
			;
		}

		var descendants = getDescendantScripts(element);
		for (var j=0; j<descendants.length; j++) {
			var script = descendants[j];
			if (areTests(script)) {
				return true;
			}
		}
		return false;
	};

	var getElementName = function(element,name) {
		// TODO: Believe element == html.top would work below and then parent could be removed from JsapiHtml implementations
		if (element.parent == null) {
			return name;
		} else if (element.getJsapiAttribute("id")) {
			return element.getJsapiAttribute("id");
		} else {
			if (select(element.getChildren(), isNameDiv)) {
				return select(element.getChildren(), isNameDiv).getContentString();
			} else {
				return "<" + element.localName + ">";
			}
		}
	}

	var getTestElement = function() {
		return html.top;
	}

	var isScenario = function(element) {
		return element.localName == "script" && element.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "tests");
	}

	var elementIndex = 0;

	var getPartDescriptor = function recurse(scope,element) {
		if (!scope) throw new Error("No scope in getSuite");
		var shared = getShared(scope);
		var isScript = element.localName == "script";

		var initialize = function(s) {
			var relative = shared.relativeScope(element);
			assign(s,relative);
			s.scope = s;
			var initializes = getScripts(element,"initialize");
			for (var i=0; i<initializes.length; i++) {
				run(initializes[i].getContentString(), s);
			}
		}
		if (isScenario(element)) {
			var rv = {
				name: getElementName(element,name),
				initialize: initialize,
				destroy: function() {
					var destroys = getScripts(element,"destroy");
					for (var i=0; i<destroys.length; i++) {
						run(destroys[i].getContentString(),shared.createTestScope(scope));
					}
				},
				execute: function(tscope,verify) {
					var hscope = {};
					for (var x in tscope) {
						hscope[x] = tscope[x];
					}
					hscope.verify = verify;
					hscope.test = verify.test;
					hscope.scope = hscope;
					run({
						name: "jsapi://html/" + elementIndex++,
						type: "application/javascript",
						string: element.getContentString()
					},hscope);
				}
			};
			return rv;
		} else if (isScript) {
			//	do nothing
			var breakpiont = 1;
		} else {
			var rv = {
				name: getElementName(element,name),
				initialize: initialize,
				destroy: function(s) {
					var destroys = getScripts(element,"destroy");
					for (var i=0; i<destroys.length; i++) {
						run(destroys[i].getContentString(),s);
					}
				},
				parts: {}
			}
			var children = element.getChildren();
			for (var i=0; i<children.length; i++) {
				(function(element) {
					var descend = isScenario(element) || someAreTests(element);
					//Packages.java.lang.System.err.println("some tests = " + descend + " for " + element);
					if (descend) {
						rv.parts[String(i)] = recurse(scope,element);
//						var child = (scope,element);
//						if (!child) throw new Error("No child for element " + element);
//						if (child.scenario) {
//							rv.parts[String(i)] = {
//								create: child.scenario
//							};
////								SUITE.scenario(String(i), {
////									create: child.scenario
////								});
//						} else {
//							rv.parts[String(i)] = child;
////								SUITE.suite(String(i),child);
//						}
					}
				})(children[i]);
			}
			return rv;
		}
	}

	this.getSuiteDescriptor = function(scope) {
		return getPartDescriptor(scope,html.top);
	};

	this.getSuite = $api.deprecate(this.getSuiteDescriptor);
	
	if ($context.test) {
		this.getElement = function(path) {
			return getElement(html.top, path);
		}
	}
};

// TODO: What is this used for? May be used for (obsolete?) building of documentation bundles
$exports.getCode = function(path) {
	return $loader.get(path).read(String);
};
