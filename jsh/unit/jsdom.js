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
	this.name = p.name;
	
	var namespaces = (p.namespaces) ? p.namespaces : [];
	var attributes = (p.attributes) ? p.attributes : [];
	var children = (p.children) ? p.children : [];
	
	this.toString = function() {
		//	TODO	allow empty element model
		var rv = {};
		rv.name = this.name.local;
		rv.attributes = (function() {
			if (attributes.length == 0) return "";
			return " " + attributes.map(function(attribute) {
				return attribute.local + "=" + "\"" + attribute.value + "\"";
			}).join(" ");
		})();
		rv.content = children.join("");
		return "<" + rv.name + rv.attributes + ">" + rv.content + "</" + rv.name + ">";
	}
	
	this.get = function(p) {
		var filter = (function() {
			if (p.name && typeof(p.name) == "string") {
				return function(node) {
					return node.name.namespace == "" && node.name.local == p.name;
				}
			} else if (typeof(p) == "function") {
				return p;
			}
		})();
		if (p.recurse) {
			throw new Error("Unimplemented: recurse.");
		} else {
			return children.filter(filter);
		}
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
	
	this.append = function(child) {
		children.push(child);
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

$exports.Element = Element;
$exports.Document = Document;

$exports.Document.E4X = function(e4x) {
	var ns = (function() {
		if (e4x.length() > 1) {
			return (function() {
				for (var i=0; i<e4x.length(); i++) {
					if (e4x[i].nodeKind() == "element") return e4x[i].namespace();
				}
			})();
		} else {
			return e4x.namespace();
		}
	})();
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
		debugger;
	}
	
	return rv;
}