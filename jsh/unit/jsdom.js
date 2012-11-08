var Node = function() {
}

var Comment = function(p) {
	this.toString = function() {
		return "<!--" + p + "-->";
	}
}

var Text = function(p) {
	this.toString = function() {
		return p;
	}
}

var Element = function(p) {
	//	Much complexity seeps into the model if nodes need to be aware of their parents; now, when adding a child to a parent,
	//	we need to update the child's parent property. When updating a child's parent property, we need to place it somewhere in
	//	its parent's children. But most objects don't work this way. An object that is a property of another JavaScript object
	//	cannot navigate to its parent. So we will try to implement the model in this way.
	
	this.name = p.name;
	
	var namespaces = (p.namespaces) ? p.namespaces : [];
	var attributes = (p.attributes) ? p.attributes : [];
	var children = (p.children) ? p.children : [];
	
	this.serialize = function(p) {
		var scope = {};
		var xmlns = "";
		for (var x in p.namespaces) {
			scope[x] = p.namespaces[x];
		}
		namespaces.forEach(function(namespace) {
			scope[namespace.uri] = namespace.prefix;
			if (!namespace.prefix) {
				xmlns = namespace.uri;
			}
		});
		var rv = {};		
		rv.name = (function() {
			var prefix = scope[this.name.namespace];
			if (this.name.namespace && typeof(prefix) == "undefined") {
				if (xmlns) {
					//	add a namespace
					throw new Error();
				} else {
					//	make my namespace the default namespace
					scope[this.name.namespace] = "";
					namespaces.unshift({
						prefix: "",
						uri: this.name.namespace
					});
					return this.name.local;
				}
			} else if (prefix) {
				return prefix + ":" + this.name.local;
			} else {
				return this.name.local;
			}
		}).call(this);
		rv.namespaces = (function() {
			if (namespaces.length == 0) return "";
			return " " + namespaces.map(function(namespace) {
				return ((namespace.prefix) ? "xmlns:" + namespace.prefix : "xmlns")
					+ "=" + "\"" + namespace.uri + "\""
				;
			}).join(" ");
		})();
		rv.attributes = (function() {
			if (attributes.length == 0) return "";
			return " " + attributes.map(function(attribute) {
				return attribute.local + "=" + "\"" + attribute.value + "\"";
			}).join(" ");
		})();
		rv.content = children.map(function(child) {
			var params = {};
			for (var x in p) {
				params[x] = p[x];
			}
			params.namespaces = scope;
			if (child.serialize) {
				return child.serialize(params);
			} else {
				return child.toString();
			}
		}).join("");
		//	TODO	allow empty element model
		return "<" + rv.name + rv.namespaces + rv.attributes + ">" + rv.content + "</" + rv.name + ">";
	}
	
	this.toString = function() {
		return this.serialize({
			namespaces: {}
		});
	}
	
	this.getAttribute = function(p) {
		var filter = (function() {
			if (typeof(p) == "string") {
				return function(attribute) {
					return !attribute.namespace && attribute.local == p;
				};
			}			
		})();
		var match = attributes.filter(filter);
		if (match.length == 0) return null;
		//	TODO	too many matches
		return match[0].value;
	}
	
	this.get = function(p) {
		var filter = (function() {
			if (p && p.name && typeof(p.name) == "string") {
				return function(node) {
					return node.name.namespace == "" && node.name.local == p.name;
				}
			} else if (p && typeof(p.filter) == "function") {
				return p.filter;
			} else if (typeof(p) == "function") {
				return p;
			} else if (typeof(p) == "undefined") {
				return function(node) {
					return true;
				};
			} else {
				throw new Error();
			}
		})();
		if (p && p.recurse) {
			throw new Error("Unimplemented: recurse.");
		} else {
			return children.filter(filter);
		}
	}
	
	this.insert = function(child,where) {
		if (!where) {
			this.append(child);
		} else if (typeof(where.index) == "number") {
			children.splice(where.index,0,child);
		} else {
			throw new Error("Unimplemented.");
		}
	}
	
	this.append = function(child) {
		children.push(child);
	}
	
	this.remove = function(p) {
		var child;
		if (p.recursive && p.node) {
			child = p.node;			
		} else {
			child = p;
		}
		for (var i=0; i<children.length; i++) {
			debugger;
			if (children[i] == child) {
				debugger;
				children.splice(i,1);
				return;
			}
			if (p.recursive && children[i].remove) {
				children[i].remove(p);
			}
		}			
	}
}

var Document = function(p) {
	var nodes = [];
	
	this.get = function(filter) {
		return nodes.filter(filter);
	}
	
	this.addNode = function(node) {
		nodes.push(node);
	}
	
	this.toString = function() {
		return nodes.join("");
	}
};

$exports.Text = Text;
$exports.Element = Element;
$exports.Document = Document;

$exports.Document.E4X = function(e4x) {
	var rv = new Document();
	
	var toElement = function(e4x) {
		var namespaces = [];
		for (var i=0; i<e4x.namespaceDeclarations().length; i++) {
			var declaration = e4x.namespaceDeclarations()[i];
			namespaces.push({
				prefix: declaration.prefix,
				uri: declaration.uri
			});
		}
		var attributes = [];
		for (var i=0; i<e4x.attributes().length(); i++) {
			var attribute = e4x.attributes()[i];
			var uri = attribute.name().uri;
			var localName = attribute.name().localName;
			if (uri == "http://www.w3.org/2000/xmlns/") {
			} else {
				attributes.push({
					namespace: uri,
					local: localName,
					value: String(attribute)
				});
			}
		}
		var children = [];
		for (var i=0; i<e4x.children().length(); i++) {
			children.push(toNode(e4x.children()[i]))
		}
		return new Element({
			name: {
				namespace: e4x.namespace().uri,
				local: e4x.localName()
			},
			namespaces: namespaces,
			attributes: attributes,
			children: children
		});
	}
	
	var toNode = function(e4x) {
		if (e4x.nodeKind() == "comment") {
			//	TODO	the below does not work for some reason; is it a Rhino bug?
			if (false) {
				return new Comment(/\<\!\-\-(.*)\-\-\>/.exec(String(e4x))[1]);
			} else {
				return new Comment(String(e4x).substring("<!--".length, String(e4x).length-"-->".length));
			}
		} else if (e4x.nodeKind() == "text") {
			return new Text(String(e4x));
		} else if (e4x.nodeKind() == "element") {
			return toElement(e4x);
		}
		debugger;
		throw new Error();
	}
	
	for (var i=0; i<e4x.length(); i++) {
		rv.addNode(toNode(e4x[i]));
	}
	
	return rv;
}