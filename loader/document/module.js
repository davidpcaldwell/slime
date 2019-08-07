var parsers = {};

var global = (function() { return this; })();

if (global.window == global) {
	var parseDom = function(unparsed) {
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
		return doc;
	};

	var Doctype = function(dom) {
		["name", "publicId", "systemId"].forEach(function(property) {
			Object.defineProperty(this, property, {
				get: function() {
					return dom[property];
				},
				enumerable: true
			})
		},this);
	};

	var Parent = function(dom) {
		
	}

	var Element = function(dom) {
		this.name = dom.tagName.toLowerCase();
	};

	var Node = function(dom) {
		this.dom = dom;

		if (dom.nodeType == dom.DOCUMENT_TYPE_NODE) {
			this.doctype = new Doctype(dom);
		} else if (dom.nodeType == dom.ELEMENT_NODE) {
			this.element = new Element(dom);
		}
	}

	var NodeList = function(dom) {
		Object.defineProperty(this, "length", {
			get: function() {
				return dom.length;
			},
			enumerable: true
		});

		this.get = function(index) {
			//	TODO	might be useful to build a map of these to prevent new object creation and allow caching
			return new Node(dom[index]);
		};
	}

	var Document = function(p) {
		this.dom = p.dom;

		Object.defineProperty(this, "document", {
			value: new function() {
				Object.defineProperty(this, "element", {
					get: function() {
						return new Node(p.dom.documentElement);
					},
					enumerable: true
				});
			},
			enumerable: true
		})

		Object.defineProperty(this, "children", {
			get: $api.Function.memoized(function() {
				return new NodeList(p.dom.childNodes);
			}),
			enumerable: true
		});

		Object.defineProperty(this, "element", {
			get: function() {
				return new Node( p.dom.documentElement );
			},
			enumerable: true
		});
	};

	parsers.browser = function(html) {
		return new Document({ dom: parseDom(html) });
	}
}

if ($platform.java && $platform.java.getClass("org.jsoup.Jsoup")) {
	var isDocumentType = $context.$slime.java.isJavaType(Packages.org.jsoup.nodes.DocumentType);
	var isElement = $context.$slime.java.isJavaType(Packages.org.jsoup.nodes.Element);

	var filters = {
		element: function(node) { return Boolean(node.element); }
	};

	var Parent = function(p) {
		Object.defineProperty(this, "children", {
			get: $api.Function.memoized(function() {
				return new NodeList({ parent: p.jsoup });
			}),
			enumerable: true
		});
	}

	var Doctype = function(p) {
		Object.defineProperty(this, "name", {
			get: $api.Function.pipe(function() {
				return p.jsoup.attr("name");
			}, $context.$slime.java.adapt.String),
			enumerable: true
		});

		Object.defineProperty(this, "systemId", {
			get: function() {
				return "sys";
			},
			enumerable: true
		});

		Object.defineProperty(this, "publicId", {
			get: function() {
				return "pub";
			},
			enumerable: true
		});
	};

	var Element = function(p) {

		var name = $context.$slime.java.adapt.String(p.jsoup.tagName());

		Object.defineProperty(this, "name", {
			value: name,
			enumerable: true
		});
	}

	var Node = function(p) {
		this.jsoup = p.jsoup;

		if (isDocumentType(p.jsoup)) {
			this.doctype = new Doctype({ jsoup: p.jsoup });
		} else if (isElement(p.jsoup)) {
			Parent.call(this,p);
			this.element = new Element({ jsoup: p.jsoup });
			this.toString = function() {
				return "Element";
			}
		}
	}

	var NodeList = function(p) {
		if (p.parent) {
			Object.defineProperty(this, "length", {
				get: function() {
					return p.parent.childNodes().size();
				},
				enumerable: true
			});

			this.get = function(index) {
				var _jsoup = p.parent.childNodes().get(index);
				if (!_jsoup) return null;
				return new Node({ jsoup: _jsoup });
			}

			var array = (function() {
				var rv = [];
				for (var i=0; i<this.length; i++) {
					rv[i] = this.get(i);
				}
				return rv;
			}).bind(this);

			this.filter = function() {
				return Array.prototype.filter.apply(array(), arguments);
			};
		} else {
			throw new Error();
		}
	}

	parsers.jsoup = (function() {
		var Document = function(p) {
			this.jsoup = p.jsoup;
	
			Parent.call(this,p);

			var document = new (function(parent) {
				Object.defineProperty(this, "element", {
					get: $api.Function.pipe(
						$api.Function.returning(parent.children), 
						function(array) {
							return array.filter(filters.element);
						},
						function(array) {
							if (array.length > 1) throw new Error();
							if (array.length == 0) return null;
							return array[0];
						}
					),
					enumerable: true
				})
			})(this);

			Object.defineProperty(this, "document", {
				value: document,
				enumerable: true
			});
		};

		return function(html) {
			return new Document({ jsoup: Packages.org.jsoup.Jsoup.parse(html) });
		};
	})();
}

var parser = (function() {
	if (parsers.browser) return parsers.browser;
	if (parsers.jsoup) return parsers.jsoup;
})();

$exports.load = function(p) {
	if (p.loader && p.path) {
		var html = p.loader.get(p.path).read(String);
		return parser(html);
	} else {
		throw new TypeError();
	}
}
