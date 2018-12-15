// TODO: The "loader/api DOM," as it is termed here, is undocumented, and should be documented, at least at the contributor level.
// it is essentially an adapter layer that translates both browser DOMs and other document formats into a common representation
// for processing by the test execution framework

var api = new function() {
	var loader;
	
	var getLoader = function() {
		if (!loader) {
			loader = new inonit.loader.Loader(inonit.loader.base);
		}
		return loader;
	};
	
	this.ui = (function() {
		if ($context.api.ui) return $context.api.ui;
		return getLoader().value("api/ui/loader.js")();
	})();
	
	this.apiHtmlScript = (function() {
		if ($context.api.apiHtmlScript) return $context.api.apiHtmlScript;
		return getLoader().file("api/api.html.js");
	})();
};

var DOM = function(base,root) {
	var getCode = function(e) {
		var rv = "";
		//	IE
		var nodes = (e.childNodes.length) ? e.childNodes : [ { data: e.text } ];
		for (var i=0; i<nodes.length; i++) {
			var data = nodes[i].data;
			if (!data) {
				data = nodes[i].innerHTML;
			}
			if (data) {
				data = data.replace(/\&amp\;/g, "&").replace(/\&lt\;/g, "<");
			}
			rv += data;
		}
		if (/^\<\!\[CDATA\[/.test(rv)) {
			rv = rv.substring("<[!CDATA[".length,rv.length-"]]>".length);
		}
		return rv;
	};

	var Element = function(node,parent) {
		this.localName = node.tagName.toLowerCase();

		this.getAttribute = function(name) {
			return node.getAttribute(name);
		}

		this.getJsapiAttribute = function(name) {
			//	Would not work in IE
			return node.getAttribute("jsapi:" + name);
		}

		this.getContentString = function() {
			return getCode(node);
		}

		var wrap = function(node,parent) {
			return new Element(node,parent);
		}

		this.getChildren = function() {
			var rv = [];
			var children = Array.prototype.slice.call(node.children).filter(function(node) {
				return node.nodeType == node.ELEMENT_NODE || node.nodeType == 1;
			});
			for (var i=0; i<children.length; i++) {
				rv[i] = wrap(children[i],this);
			}
			return rv;
		}

		if (parent) {
			this.parent = parent;
		}

		this.$dom = node;

		this.replaceContentWithContentOf = function(other) {
			//	There would be DOM-based ways to do this, but they would require importNode, adoptNode,
			//	something like that; this seems more supported
			this.$dom.innerHTML = other.$dom.innerHTML;
		};

		this.removeJsapiAttribute = function(name) {
			//	TODO	does this work in IE?
			node.removeAttribute("jsapi:" + name);
		};

		//	TODO	Clearly there is no test case that exercises this method. It was added as part of
		//			resolving issues with including one file's content in another: the included file, if
		//			it contains relative path references, needs to somehow know where it came from so that
		//			it can resolve the relative paths relative to itself rather than relative to the file
		//			in which it was included. So probably need a test case on browser side that does that
		//			and then we can implement and fix this. Don't recall specifically, but dimly recall
		//			the object returned by this is supposed to be opaque to generic layers and somehow is
		//			used as a marker somewhere where it is passed back to an implementation-specific method
		//			for use.
		this.getRelativePath = function() {
			throw new Error("Unimplemented: getRelativePath");
		};

		//	Below unverified as to use

		this.toString = function() {
			return node.toString();
		}
	};
	var topElement = (root.documentElement) ? root.documentElement : root;

	this.top = new Element(topElement);
	this.$dom = {
		root: root
	};
	this.load = function(path) {
		return getLoaderApiDom(base+path);
	};
}

var getLoaderApiDom = function(location) {
	var unparsed = inonit.loader.$sdk.fetch(location);
	if (false) {
		var div = document.createElement("div");
		//	TODO	there may be a more complex, robust, standards-compliant way of doing this
		//			maybe with DocumentObjectModel or whatever
		div.innerHTML = unparsed;
		var root = (function() {
			for (var i=0; i<div.childNodes.length; i++) {
				if (div.childNodes[i].tagName == "html") {
					return div.childNodes[i];
				}
			}
			//	browser does not preserve html element under div, at least in Chrome, rather putting title
			//	and other body content under div
			return div;
		})();
	} else {
		var doc = document.implementation.createHTMLDocument("");
		//	Added this check for Firefox, for which document.write was not doing the trick
		var didDocWriteWork = (function(doc) {
			var before = new XMLSerializer().serializeToString(doc);
			doc.open();
			doc.write(unparsed);
			//	doc.close() apparently implies window.close() in IE, which causes crash
			//	both Chrome and Firefox seem to work without it
			if (false) doc.close();
			var after = new XMLSerializer().serializeToString(doc);
			return Boolean(before != after);
		})(doc);
		if (!didDocWriteWork) {
			doc.documentElement.innerHTML = unparsed;
		}
		var root = doc;
//								var root = doc.documentElement;
	}
	var base = (function() {
		if (location.substring(location.length-1) == "/") return location;
		return location.split("/").slice(0,-1).join("/") + "/";
	})();
	return new DOM(base,root);
};

var getApiHtmlTests = function(definitionLocation) {
	var loaderApiDom = getLoaderApiDom(definitionLocation);
	return new api.apiHtmlScript.ApiHtmlTests(loaderApiDom,definitionLocation);
};

var Scope = function(definition,environment) {
	var base = (function() {
		var tokens = definition.split("/");
		if (tokens[tokens.length-1].length == 0) return tokens.join("/");
		return tokens.slice(0,tokens.length-1).join("/") + "/";
	})();
	
	var self = this;
	var Self = arguments.callee;

	this.$relative = function(getRelativePath) {
		//	TODO	since this ignores getRelativePath, it almost certainly does not work. It is currently used somewhere;
		//			tests fail without it as of 2018 Dec 14
		return new Self(base,environment);
	};

	this.$jsapi = new function() {
		// TODO: are these needed? and if so, what are they?
		this.api = {
			//	loader/browser/test/module.js
			browser: api.ui.unit,
			//	loader/api/unit.js
			unit: api.ui.api
		};

		this.loader = new function() {
			this.module = function(path,context) {
				//	TODO	probable bug here; probably works when module path ends in /, but for module path
				//			that has a terminal file name, probably needs to strip that file name to find the
				//			base from which to load the module at 'path'
				return inonit.loader.module(
					inonit.loader.nugget.page.relative(base+path),
					context
				);
			};
			this.file = function(path,context) {
				return inonit.loader.file(
					inonit.loader.nugget.page.relative(base+path),
					context
				);
			};
			this.run = function(path,scope,target) {
				return inonit.loader.run(
					inonit.loader.nugget.page.relative(base+path),
					scope,
					target
				);
			}
			//	TODO	can the below eval and string be replaced by a form of loader.get() or something?
			this.eval = function(path,scope) {
				if (!scope) scope = {};
				with(scope) {
					return eval(inonit.loader.Loader.getCode(base + path));
				}
			};
			this.string = function(path) {
				return inonit.loader.Loader.getCode(base + path);
			};
			this.coffee = window.CoffeeScript;

			//	TODO	add this.scenario; see jsh/unit/jsapi.js
		};

		this.environment = environment;
	};

	this.$platform = inonit.loader.$sdk.platform;
	this.$api = inonit.loader.$sdk.api;
};

var getPartDescriptor = function(definition,environment,path) {
	var apiHtml = getApiHtmlTests(definition);
	var scope = new Scope(definition,environment);
	var moduleScenario = apiHtml.getSuiteDescriptor(scope,path);
	moduleScenario.name = (path) ? (definition + ":" + path) : definition;
	return moduleScenario;
};

$exports.getPartDescriptor = getPartDescriptor;

if (!$context.old) {
	var suite = new api.ui.api.Suite();
	api.ui.suite(suite);
	$exports.suite = suite;
}
