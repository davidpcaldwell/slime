//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

window.addEventListener("load", function() {
	var settings = (window.slime && window.slime.definition && window.slime.definition.settings) ? window.slime.definition.settings : void(0);
	if (settings && settings.isHomePage) {
		Array.prototype.slice.call(document.getElementsByTagName("A")).forEach(function(link) {
			link.target = "_blank";
		})
	}

	//	TODO	Perhaps verify div class="object" li elements have div class="name"
	//	TODO	verify the "has properties" after div class="object"

	var getJsapiAttribute = function(element,name) {
		return element.getAttribute("jsapi:" + name);
	}

	var getBase = function(url) {
		return url.split("/").slice(0,-1).join("/") + "/";
	}

	var canonicalize = function(base,relative) {
		var tokens = (base + relative).split("/");
		var elements = [];
		for (var i=0; i<tokens.length; i++) {
			if (tokens[i] == "..") {
				elements.splice(elements.length-1,1);
			} else {
				elements.push(tokens[i]);
			}
		}
		return elements.join("/");
	}

	var Markup = function Markup(c) {
		var getNamedChild = function(base,name) {
			for (var i=0; i<base.children.length; i++) {
				var child = base.children[i];
				if (child.getAttribute("jsapi:id")) {
					if (child.getAttribute("jsapi:id") == name) {
						return child;
					}
				} else {
					var sub = getNamedChild(child,name);
					if (sub) return sub;
				}
			}
			return null;
		}
		var scope = new function() {
			this.getApi = function(relative) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", c.base + relative, false);
				xhr.send(null);
				var dom = document.implementation.createHTMLDocument("title");
				dom.documentElement.innerHTML = xhr.responseText;
				console.log("Response to " + relative + " is " + dom);
				return {
					document: dom,
					getElement: function(path) {
						var node = dom.documentElement;
						var tokens = path.split("/");
						for (var i=0; i<tokens.length; i++) {
							node = getNamedChild(node,tokens[i]);
							if (!node) break;
						}
						var base = getBase(canonicalize(c.base,relative));
						return {
							base: base,
							node: node
						};
					}
				}
			};
		};

		this.scope = scope;

		var getDescendants = function(under,filter) {
			var rv = [];
			var all = under.getElementsByTagName("*");
			for (var i=0; i<all.length; i++) {
				if (filter(all[i])) {
					rv.push(all[i]);
				}
			}
			return rv;
		}

		var getElements = function(filter) {
			return getDescendants(c.node,filter);
		}

		var fixFunctionDivs = function(className,heading) {
			var matchingDivs = getElements(function(e) {
				return e.tagName.toLowerCase() == "div" && e.className.indexOf(className) != -1;
			});
			for (var i=0; i<matchingDivs.length; i++) {
				var children = matchingDivs[i].childNodes;
				var first = null;
				for (var j=0; j<children.length; j++) {
					if (!first && children[j].nodeType == 1) {
						first = children[j];
						//	element
					}
				}
				if (first
					&& (first.tagName.toLowerCase() == "div")
					&& first.className == "label" && first.innerHTML == heading
				) {
					//	ok
				} else {
					var it = document.createElement("div");
					it.className = "label error";
					it.innerHTML = heading;
					matchingDivs[i].insertBefore(it, children[0]);
				}
			}
		};

		var fixScriptElements = function() {
			var matchingScriptElements = getElements(function(e) {
				return e.tagName.toLowerCase() == "script" && /^application\/x.jsapi\#/.test(e.type) || e.getAttribute("data-jsapi") == "show";
			});
			matchingScriptElements.forEach(function(element) {
				console.log(element);
				var CDATA_START = "<" + "!" + "[" + "CDATA" + "[";
				var CDATA_END = "]" + "]" + "]";
				if (element.innerHTML.substring(0,CDATA_START.length) == CDATA_START) {
					element.innerHTML = element.innerHTML.substring(CDATA_START.length,element.innerHTML.length-CDATA_END.length);
				}
				var lines = element.innerHTML.split("\n");
				var isWhitespace = function(line) {
					return /^\s*$/.test(line);
				}
				while(lines.length && isWhitespace(lines[0])) {
					lines.splice(0,1);
				}
				while(lines.length && isWhitespace(lines[lines.length-1])) {
					lines.splice(lines.length-1,1);
				}
				var prefix;
				var matcher = /^(\s*)(\S+)/;
				for (var i=0; i<lines.length; i++) {
					var match = matcher.exec(lines[i]);
					if (match) {
						console.log("match = ", JSON.stringify(match[1]), JSON.stringify(match[2]));
						if (typeof(prefix) == "undefined") {
							prefix = match[1];
						} else if (match[1].length > prefix.length) {
							if (match[1].substring(0,prefix.length) == prefix) {
								//	do nothing
							} else {
								prefix = "";
							}
						} else {
							if (prefix.substring(0,match[1].length) == match[1]) {
								prefix = match[1];
							}
						}
					} else {
						console.log("no match: ", JSON.stringify(lines[i]));
					}
				}
				var fixed = lines.map(function(line) {
					if (line.substring(0,prefix.length) == prefix) {
						return line.substring(prefix.length);
					} else {
						return line;
					}
				});
				var id = getJsapiAttribute(element,"id");
				if (id) {
					//	TODO	develop better way to display this, perhaps outside the script element?
					//	TODO	would be better to display path
					fixed.splice(0,0,"//\tjsapi:id=" + id);
				}
				element.innerHTML = fixed.join("\n");
				console.log(JSON.stringify(element.innerHTML));
			});
		};

		var resolveReferences = function() {
			var references = getElements(function(e) {
				return e.getAttribute("jsapi:reference");
			});
			for (var i=0; i<references.length; i++) {
				var code = references[i].getAttribute("jsapi:reference");
				var getApi = function(relative) {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", c.base + relative, false);
					xhr.send(null);
					var dom = document.implementation.createHTMLDocument("title");
					dom.documentElement.innerHTML = xhr.responseText;
					console.log("Response to " + relative + " is " + dom);
					return {
						document: dom,
						getElement: function(path) {
							var node = dom.documentElement;
							var tokens = path.split("/");
							for (var i=0; i<tokens.length; i++) {
								node = getNamedChild(node,tokens[i]);
								if (!node) break;
							}
							var base = getBase(canonicalize(c.base,relative));
							return {
								base: base,
								node: node
							};
						}
					}
				};
				var found = eval(code);
				console.log("Found",found,"for",code);
				if (found.node) {
					references[i].innerHTML = found.node.innerHTML;
					new Markup({ node: references[i], base: found.base }).fix();
				}
			}

			getElements(function(e) {
				return e.getAttribute("jsapi:replace");
			}).forEach(function(replace) {
				var expression = replace.getAttribute("jsapi:replace");
				with(scope) {
					var nodes = eval(expression);
					if (nodes.node) nodes = nodes.node;
					if (nodes.length) {
						//	TODO	if nodes is a NodeList rather than Array, we're in trouble. Fix here.
						nodes = Array.prototype.slice.call(nodes);
						var fragment = document.createDocumentFragment();
						for (var i=0; i<nodes.length; i++) {
							fragment.appendChild(nodes[i]);
						}
						nodes = fragment;
					}
					replace.parentNode.replaceChild(nodes,replace);
					//	TODO	Need recursion, equivalent of new Markup().fix() above; may also need to add node property
					//			representing load location if it doesn't exist and iterate through all nodes adding it in
					//			getElement
				}
			})
		}

		var fixCdata = function() {
			var elements = document.getElementsByTagName("*");
			for (var i=0; i<elements.length; i++) {
				var children = elements[i].childNodes;
				for (var j=0; j<children.length; j++) {
					if (children[j].nodeType == 4) {
						debugger;
					} else if (children[j].nodeType == children[j].COMMENT_NODE && children[j].data.substring(0,7) == "[CDATA[") {
						var data = children[j].data;
						var text = document.createTextNode("<![CDATA[" + data.substring(7,data.length-"]]".length) + "]]");
						elements[i].replaceChild(text,children[j]);
					}
				}
			}
		}

		this.fix = function() {
			fixFunctionDivs("arguments", "Arguments");
			fixFunctionDivs("returns", "Returns");
			fixFunctionDivs("instances", "Instances");
			fixScriptElements();
			fixCdata();

			resolveReferences();
		}
	};

	var markup = new Markup({ node: document, base: getBase(window.location.href) });
	window.slime.definition.getApi = function() {
		return markup.scope.getApi.apply(markup.scope,arguments);
	}
	markup.fix();
});
if (!window.slime) window.slime = {};
if (!window.slime.definition) window.slime.definition = {};
