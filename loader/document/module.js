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
	}

	var Node = function(dom) {
		this.dom = dom;

		if (dom.nodeType == dom.DOCUMENT_TYPE_NODE) {
			this.doctype = new Doctype(dom);
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

		Object.defineProperty(this, "children", {
			get: $api.Function.memoized(function() {
				return new NodeList(p.dom.childNodes);
			}),
			enumerable: true
		});
	};

	parsers.browser = function(html) {
		return new Document({ dom: parseDom(html) });
	}
}

if ($platform.java && $platform.java.getClass("org.jsoup.Jsoup")) {
	var isDocumentType = $context.$slime.java.isJavaType(Packages.org.jsoup.nodes.DocumentType);

	var Doctype = function(p) {
		this.jsoup = p.jsoup;

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
	}

	var Node = function(p) {
		this.jsoup = p.jsoup;

		if (isDocumentType(p.jsoup)) {
			this.doctype = new Doctype({ jsoup: p.jsoup });
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
				return new Node({ jsoup: p.parent.childNodes().get(index) });
			}
		} else {
			throw new Error();
		}
	}

	parsers.jsoup = (function() {
		var Document = function(p) {
			this.jsoup = p.jsoup;
	
			Object.defineProperty(this, "children", {
				get: $api.Function.memoized(function() {
					return new NodeList({ parent: p.jsoup });
				}),
				enumerable: true
			});
		};

		return function(html) {
			return new Document({ jsoup: Packages.org.jsoup.Jsoup.parse(html) })
			throw new Error("JSoup!");
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
