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
	if (typeof($context) == "object" && $context.run) {
		$context.run(arguments[0],arguments[1]);
	} else {
		with(arguments[1]) {
			eval(arguments[0]);
		}
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
		rv = select(getDescendants(rv), hasJsapiId(tokens[i]));
		if (typeof(rv) == "undefined") {
			return null;
		}
	}
	return rv;
}

//	Creates an object representing an api.html given its HTML and a 'name' used to name the top-level scenario; this object can:
//		.getContexts(scope): produce the list of contexts declared on the page
//		.getScenario(scope,unit): produce a unit.before.js/Scenario given a scope and a test path
//
$exports.ApiHtmlTests = function(html,name) {
	var jsapiReferenceFilter = function(element) {
		return element.getJsapiAttribute("reference") != null;
	}

	//	Cannot have reference at top level, currently

	var references = filter(getDescendants(html.top), jsapiReferenceFilter);
	for (var i=0; i<references.length; i++) {
		var scope = new function() {
			this.getApi = function(path) {
				var otherhtml = html.load(path);
				var rv = new $exports.ApiHtmlTests(otherhtml,name+":"+path);
				rv.getElement = function(path) {
					return getElement(otherhtml.top,path);
				}
				return rv;
			}
		};
		var reference = references[i].getJsapiAttribute("reference");
		var element = (function() {
			var rv;
			with(scope) {
				rv = eval(reference);
			}
			return rv;
		})();
		references[i].replaceContentWithContentOf(element);
		//	TODO	is the next line necessary? If not, can also remove this call in the DOM/E4X implementations
		references[i].removeJsapiAttribute("reference");
	}

//	for each (var e in xhtml..*.(@jsapi::reference.length() > 0)) {
//		var resolved = declaration.resolve(e);
//		if (resolved) {
//			e.setChildren(resolved.children());
//		} else {
//			throw new Error("Could not resolve: " + e.@jsapi::reference.toXMLString());
//		}
//	}

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
	}

	var getDescendantScripts = function(element,type) {
		return filter(getDescendants(element),getScriptFilter(type));
	}

	var isNameDiv = function(element) {
		return element.localName == "div" && element.getAttribute("class") == "name";
	}

	this.getContexts = function(scope) {
		var contextScripts = getDescendantScripts(html.top,"context");

		var contexts = [];
		for (var i=0; i<contextScripts.length; i++) {
			var id = (contextScripts[i].getJsapiAttribute("id")) ? contextScripts[i].getJsapiAttribute("id") : "";
			with(scope) {
				try {
					var value = eval("(" + contextScripts[i].getContentString() + ")");
				} catch (e) {
					var error = new Error("Error instantiating context");
					error.cause = e;
					error.code = contextScripts[i].getContentString();
					throw error;
				}
			}
			//	If the value produced is null or undefined, this context is not used
			if (value) {
				if (value.length) {
					for (var j=0; j<value.length; j++) {
						value[j].id = id + "[" + j + "]";
					}
					contexts = contexts.concat(value);
				} else {
					value.id = id;
					contexts.push(value);
				}
			}
		}

		if (contexts.length == 0) {
			contexts.push({});
		}

		return contexts;
	}

	var getScenario = function(scope,element,container) {
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
		}

		var p = {};
		if (element.parent == null) {
			p.name = name;
		} else if (element.getJsapiAttribute("id")) {
			p.name = element.getJsapiAttribute("id");
		} else {
			if (select(element.getChildren(), isNameDiv)) {
				p.name = select(element.getChildren(), isNameDiv).getContentString();
			} else {
				p.name = "<" + element.localName + ">";
			}
		}

		p.initialize = function() {
			if (container) {
				for (var i=0; i<container.initializes.length; i++) {
					run(container.initializes[i].getContentString(), createTestScope());
				}
			}
			var initializes = getScripts(element,"initialize");
			for (var i=0; i<initializes.length; i++) {
				run(initializes[i].getContentString(), createTestScope());
			}
		};

		p.execute = function(unit) {
			var children = (function() {
				if (element.localName == "script" && element.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "tests")) {
					return [ element ];
				} else {
					return element.getChildren();
				}
			})();
			for (var i=0; i<children.length; i++) {
				if (children[i].localName == "script" && children[i].getAttribute("type") == (SCRIPT_TYPE_PREFIX + "tests")) {
					run(children[i].getContentString(),createTestScope(scope,unit));
				} else if (children[i].localName == "script") {
					//	do nothing
				} else {
					var areTests = function(script) {
						return script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "initialize")
							|| script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "tests")
							|| script.getAttribute("type") == (SCRIPT_TYPE_PREFIX + "destroy")
						;
					}

					var someAreTests = (function() {
						var descendants = getDescendantScripts(children[i]);
						for (var j=0; j<descendants.length; j++) {
							var script = descendants[j];
							if (areTests(script)) {
								return true;
							}
						}
						return false;
					})();

					if (someAreTests) {
						unit.scenario(getScenario(scope,children[i]));
					}
				}
			}
		};

		p.destroy = function() {
			var destroys = getScripts(element,"destroy");
			for (var i=0; i<destroys.length; i++) {
				run(destroys[i].getContentString(),createTestScope());
			}
			if (container) {
				for (var i=0; i<container.destroys.length; i++) {
					run(container.destroys[i].getContentString(),createTestScope());
				}
			}
		};

		return p;
	}

	this.getScenario = function(scope,unit) {
		var element = (function() {
			if (unit) {
				var getJsapiChild = function(target,id) {
					var elements = target.getChildren();
					for (var i=0; i<elements.length; i++) {
						if (elements[i].getJsapiAttribute("id") == id) {
							return elements[i];
						} else if (elements[i].getJsapiAttribute("id") == null) {
							var childSearch = getJsapiChild(elements[i],id);
							if (childSearch != null) return childSearch;
						}
					}
					return null;
				}

				var tokens = unit.split("/");
				var target = html.top;
				for (var i=0; i<tokens.length; i++) {
					target = getJsapiChild(target,tokens[i]);
					if (target == null) {
						throw new Error("Element not found: " + tokens.slice(0,i+1).join("/"));
					}
				}
				return target;
			} else {
				return html.top;
			}
		})();
		var container = {
			initializes: [],
			destroys: []
		}
		if (unit) {
			var ancestor = element;
			while(ancestor.parent) {
				container.initializes.unshift.apply(container.initializes,getScripts(ancestor.parent,"initialize"));
				container.destroys.push.apply(container.destroys,getScripts(ancestor.parent,"destroy"));
				ancestor = ancestor.parent;
			}
		}
		if (!element) throw new Error("Unit test not found: " + unit);
		return getScenario(scope,element,container);
	}
}