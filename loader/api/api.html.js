$exports.MEDIA_TYPE = "application/x.jsapi";

$exports.ApiHtmlTests = function(html,name) {
	var SCRIPT_TYPE_PREFIX = $exports.MEDIA_TYPE + "#";

	var scripts = [];

	html.getScriptDescendants().forEach( function(node) {
		var type = node.getScriptType();
		if (type.substring(0,SCRIPT_TYPE_PREFIX.length) == SCRIPT_TYPE_PREFIX) {
			scripts.push({ type: type.substring(SCRIPT_TYPE_PREFIX.length), element: node });
		}			
	});

	this.getContexts = function(scope) {
		var contextScripts = html.top.getDescendantScripts("context");

		var contexts = [];
		for (var i=0; i<contextScripts.length; i++) {
			var id = (contextScripts[i].getJsapiId()) ? contextScripts[i].getJsapiId() : "";
			with(scope) {
				var value = eval("(" + contextScripts[i].getContentString() + ")");
			}
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

		if (contexts.length == 0) {
			contexts.push({});
		}

		return contexts;
	}

	var getScenario = function(scope,element) {
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
			var initializes = element.getScripts("initialize");
			for (var i=0; i<initializes.length; i++) {
				with(scope) {
					eval(initializes[i].getContentString());
				}
			}
		};

		p.execute = function(unit) {
			var children = element.getChildElements();
			for (var i=0; i<children.length; i++) {
				if (children[i].localName == "script" && children[i].getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")) {
					with(scope) {
						with(unit) {
							eval(children[i].getContentString());
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

					if (
						children[i].getDescendantScripts().some(function(script) {
							return areTests(script);
						})
					) {
						unit.scenario(getScenario(scope,children[i]));	
					}
				}
			}
		};

		p.destroy = function() {
			var destroys = element.getScripts("destroy");
			for (var i=0; i<destroys.length; i++) {
				with(scope) {
					eval(destroys[i].getContentString());
				}
			}
		};

		return p;
	}

	this.getScenario = function(scope,unit) {
		var element = (unit) ? html.getElementByJsapiId(unit) : html.top;
		if (!element) throw new Error("Unit test not found: " + unit);
		return getScenario(scope,element);
	}
}

