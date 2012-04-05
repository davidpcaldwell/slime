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

$exports.MEDIA_TYPE = "application/x.jsapi";

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

$exports.ApiHtmlTests = function(html,name) {
	var SCRIPT_TYPE_PREFIX = $exports.MEDIA_TYPE + "#";

	var scripts = (function() {
		var scripts = [];
		var descendants = html.top.getDescendantScripts();
		for (var i=0; i<descendants.length; i++) {
			var node = descendants[i];
			var type = node.getScriptType();
			if (type.substring(0,SCRIPT_TYPE_PREFIX.length) == SCRIPT_TYPE_PREFIX) {
				scripts.push({ type: type.substring(SCRIPT_TYPE_PREFIX.length), element: node });
			}
		}
	})();

	this.getContexts = function(scope) {
		var contextScripts = html.top.getDescendantScripts("context");

		var contexts = [];
		for (var i=0; i<contextScripts.length; i++) {
			var id = (contextScripts[i].getJsapiId()) ? contextScripts[i].getJsapiId() : "";
			with(scope) {
				var value = eval("(" + contextScripts[i].getContentString() + ")");
			}
			//	If the value produced is null or undefined, this context is not used
			if (value) {
				if (value.length) {
					value.forEach( function(context,index) {
						context.id = id + "[" + index + "]";
					});
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
		var p = {};
		if (element.isTop()) {
			p.name = name;
		} else if (element.getJsapiId()) {
			p.name = element.getJsapiId();
		} else {
			if (element.getNameDiv()) {
				p.name = element.getNameDiv();
			} else {
				p.name = "<" + element.localName + ">";
			}
		}

		p.initialize = function() {
			if (container) {
				for (var i=0; i<container.initializes.length; i++) {
					if (typeof($context) == "object" && $context.run) {
						$context.run(container.initializes[i].getContentString(),scope);
					} else {
						with(scope) {
							eval(container.initializes[i].getContentString());
						}
					}
				}
			}
			var initializes = element.getScripts("initialize");
			for (var i=0; i<initializes.length; i++) {
				if (typeof($context) == "object"  && $context.run) {
					$context.run(initializes[i].getContentString(),scope);
				} else {
					with(scope) {
						eval(initializes[i].getContentString());
					}
				}
			}
		};

		p.execute = function(unit) {
			var createTestScope = function() {
				var rv = {};
				for (var i=0; i<arguments.length; i++) {
					for (var x in arguments[i]) {
						rv[x] = arguments[i][x];
					}
				}
				return rv;
			}

			var children = (function() {
				if (element.localName == "script" && element.getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")) {
					return [ element ];
				} else {
					return element.getChildElements();
				}
			})();
			for (var i=0; i<children.length; i++) {
				if (children[i].localName == "script" && children[i].getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")) {
					if (typeof($context) == "object"  && $context.run) {
						$context.run(children[i].getContentString(),createTestScope(scope,unit));
					} else {
						with(scope) {
							with(unit) {
								eval(children[i].getContentString());
							}
						}
					}
				} else if (children[i].localName == "script") {
					//	do nothing
				} else {
					var areTests = function(script) {
						return script.getScriptType() == (SCRIPT_TYPE_PREFIX + "initialize")
							|| script.getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")
							|| script.getScriptType() == (SCRIPT_TYPE_PREFIX + "destroy")
						;
					}

					var someAreTests = (function() {
						for (var j=0; j<children[i].getDescendantScripts().length; j++) {
							var script = children[i].getDescendantScripts()[j];
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
			var destroys = element.getScripts("destroy");
			for (var i=0; i<destroys.length; i++) {
				if (typeof($context) == "object"  && $context.run) {
					$context.run(destroys[i].getContentString(),scope);
				} else {
					with(scope) {
						eval(destroys[i].getContentString());
					}
				}
			}
			if (container) {
				for (var i=0; i<container.destroys.length; i++) {
					if (typeof($context) == "object"  && $context.run) {
						$context.run(container.destroys[i].getContentString(),scope);
					} else {
						with(scope) {
							eval(container.destroys[i].getContentString());
						}
					}
				}
			}
		};

		return p;
	}

	this.getScenario = function(scope,unit) {
		var element = (function() {
			if (unit) {
				var getJsapiChild = function(target,id) {
					var elements = target.getChildElements();
					for (var i=0; i<elements.length; i++) {
						if (elements[i].getJsapiId() == id) {
							return elements[i];
						} else if (elements[i].getJsapiId() == null) {
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
				container.initializes.unshift.apply(container.initializes,ancestor.parent.getScripts("initialize"));
				container.destroys.push.apply(container.destroys,ancestor.parent.getScripts("destroy"));
				ancestor = ancestor.parent;
			}
		}
		if (!element) throw new Error("Unit test not found: " + unit);
		return getScenario(scope,element,container);
	}
}