$set(function(base,dom) {
	this.toString = function() {
		return "jsapi-dom: base=" + base + " dom=" + dom;
	}

	var Element = function(delegate,parent) {
		var map = function(query,parent) {
			return query.map(function(e) {
				return new Element(e,parent);
			});
		}

		this.localName = delegate.element.name;

		this.getAttribute = function(name) {
			return delegate.element.attributes.get(name);
		};

		this.getJsapiAttribute = function(name) {
			return delegate.element.attributes.get({
				namespace: "http://www.inonit.com/jsapi",
				name: name
			});
		}

		this.getContentString = function() {
			return delegate.children.map(function(node) {
				if (node.getString) return node.getString();
				return String(node);
			}).join("");
		}

		var children;

		this.getChildren = function() {
			if (!children) {
				children = map(delegate.children.filter(function(node) {
					return node.element;
				}), this);
			}
			return children;
		};

		//	TODO	can need for parent be eliminated? Refer back to loader/api/ and find out how it is used
		if (parent) {
			this.parent = parent;
		}

		this.$jsdom = delegate;

		this.replaceContentWithContentOf = function(other) {
			delegate.children = other.$jsdom.children.slice();
			children = null;
		}

		this.removeJsapiAttribute = function(name) {
			delegate.element.attributes.set({
				namespace: "http://www.inonit.com/jsapi",
				name: name
			}, null);
		}

		if (parent) {
			this.getRelativePath = function(path) {
				return parent.getRelativePath(path);
			};
		} else {
			this.getRelativePath = function(path) {
				return base.getRelativePath(path);
			};
			this.getRelativePath.toString = (function(underlying) {
				return function() {
					return underlying.toString.call(this) + " base=" + String(base);
				};
			})(this.getRelativePath.toString);
		}

		//	Unclear whether below used

		this.toString = function() {
			return "jsapi.js Element type=" + this.getAttribute("type") + " jsapi:reference=" + this.getJsapiAttribute("reference") + " content=" + this.getContentString();
		}
	}

	this.top = new Element(dom.document.element);

	this.load = function(path) {
		var file = base.getFile(path);
		if (file == null) {
			throw new Error("Cannot find referenced file at " + path + " from base: " + base);
		} else {
			//jsh.shell.echo("Loading " + path + " from " + base);
		}
		return loadApiHtml(base.getFile(path));
	}
});
