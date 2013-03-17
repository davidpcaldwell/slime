//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the the SLIME document API.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var choose = function(rv,filter) {
	if (filter) rv = rv.filter(filter);
	if (rv.length > 1) {
		throw new Error("Too many matches.");
	} else if (rv.length == 0) {
		return null;
	} else {
		return rv[0];
	}
}

var Node = function(p) {
	this.toString = function() {
		return this.serialize();
	};
};

var Parent = function(p) {
	var traverse = function(rv,top,p) {
		if (typeof(top.length) != "undefined") {
			for (var i=0; i<top.length; i++) {
				traverse(rv,top[i],p);			
			}			
		} else {
			if (p.filter(top)) {
				rv.push(top);
			}
			if (p.descendants(top) && top.children) {
				arguments.callee(rv,top.children,p);
			}
		}
	};

	this.children = (p && p.children) ? p.children : [];
	
	var asSearch = function(search) {
		if (typeof(search) == "function") {
			return {
				filter: search,
				descendants: function(n) {
					return true;
				}
			};
		} else {
			return search;
		}	
	}
	
	this.identify = function(search) {
		search = asSearch(search);
		if (typeof(search) == "function") {
			search = {
				filter: search,
				descendants: function(n) {
					return true;
				}
			};
		}
		var rv = [];
		traverse(rv,this.children,search);
		return choose(rv);
	};
	
	this.child = function(filter) {
		var rv = this.children.filter(filter);
		return choose(rv);
	}
	
	this.get = function(p) {
		var filtering = function(children,p) {
			var filter = (function() {
				if (p && p.name && typeof(p.name) == "string") {
					return function(node) {
						return node.name && node.name.namespace == "" && node.name.local == p.name;
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
			if (p && (p.descendants || p.recursive)) {
				//	probably want to deprecate p.recursive
				var rv = [];
				for (var i=0; i<children.length; i++) {
					var match = filter(children[i]);
					if (match) {
						rv.push(children[i]);
					}
					var recurse = (function() {
						if (typeof(p.descendants) == "function") {
							return p.descendants(children[i]);
						}
						if (p.recursive) return true;
						return false;
					})();
					if (recurse && children[i].get) {
						var descendants = children[i].get(p);
						rv.push.apply(rv, descendants);
					}
				}
				return rv;
			} else {
				return children.filter(filter);
			}
		};

		return filtering(this.children,p);
	};

	this.remove = function(p) {
		var child;
		if (p.recursive && p.node) {
			child = p.node;
		} else {
			child = p;
		}
		for (var i=0; i<children.length; i++) {
			if (children[i] == child) {
				children.splice(i,1);
				return;
			}
			if (p.recursive && children[i].remove) {
				children[i].remove(p);
			}
		}
	};
};

var Comment = function(p) {
	this.comment = {
		data: p.comment
	};

	this.serialize = function(m) {
		return "<!--" + this.comment.data + "-->";
	};
};

var Text = function(p) {
	this.text = {
		data: p.text
	};
	
	this.getString = function() {
		return this.text.data;
	};

	//	TODO	other escapes needed; see DOM3
	this.serialize = function(m) {
		return this.text.data.replace(/\</g, "&lt;").replace(/\&/g, "&amp;");
	};
};

var Cdata = function(p) {
	this.cdata = {
		data: p.cdata
	};
	
	this.getString = function() {
		return this.cdata.data;
	};

	this.serialize = function(m) {
		return "<![CDATA[" + this.cdata.data + "]]>";
	};
};

var Element = function(p) {
	Node.call(this,p);
	//	optionally adds children upon construction
	Parent.call(this,p);
	
	//	Much complexity seeps into the model if nodes need to be aware of their parents; now, when adding a child to a parent,
	//	we need to update the child's parent property. When updating a child's parent property, we need to place it somewhere in
	//	its parent's children. But most objects don't work this way. An object that is a property of another JavaScript object
	//	cannot navigate to its parent. So we will try to implement the model in this way.

	//	has namespace / name properties
	this.element = {
		type: p.type
	};

	//	objects with prefix/uri representing namespace declarations attached to this element
	var namespaces = (p.namespaces) ? p.namespaces : [];
	//	objects with namespace / name / value properties
	this.element.attributes = (p.attributes) ? p.attributes : [];
	
	var attributeFilter = function(p) {
		if (typeof(p) == "string") {
			return function(attribute) {
				return !attribute.namespace && attribute.name == p;
			};
		} else if (typeof(p.namespace) == "string" && p.name) {
			return function(attribute) {
				return attribute.namespace == p.namespace && attribute.name == p.name;
			}
		}
	};
	
	this.element.attributes.get = function(p) {
		var match = choose(this,attributeFilter(p));
		return (match) ? match.value : null;
	};
	
	this.element.attributes.set = function(p,v) {
		//	TODO	we may need a special case to handle an attempt to set an attribute with the XML Namespaces namespace, and perhaps generally for 
		//			[xX][mM][lL]
		var match = choose(this,attributeFilter(p));
		if (match && v === null) {
			for (var i=0; i<this.length; i++) {
				if (attributeFilter(p)(this[i])) {
					this.splice(i,1);
					//	Probably could return here
					i--;
				}
			}
		} else if (!match && v !== null) {
			//	TODO	with current API there is nothing to stop callers from using array methods to insert illegal attribute values
			this.push({
				namespace: p.namespace,
				name: p.name,
				value: v
			});
		} else if (!match && v === null) {
			//	do nothing; attribute already does not exist
		} else {
			match.value = v;
		}
	};
	
	//	TODO	what if someone wants to "suggest" a namespace prefix and not be stuck with jsdom_X?

	this.serialize = function(m) {
		if (!m) m = {};
		if (!m.namespaces) m.namespaces = {};
		var scope = {};
		var xmlns = "";
		for (var x in m.namespaces) {
			scope[x] = m.namespaces[x];
		}
		namespaces.forEach(function(namespace) {
			scope[namespace.uri] = namespace.prefix;
			if (!namespace.prefix) {
				xmlns = namespace.uri;
			}
		});
		var rv = {};
		rv.name = (function() {
			var prefix = scope[this.element.type.namespace];
			if (this.element.type.namespace && typeof(prefix) == "undefined") {
				if (xmlns) {
					//	add a namespace
					throw new Error();
				} else {
					//	make my namespace the default namespace
					scope[this.element.type.namespace] = "";
					//	TODO	this probably is not necessary
					if (!m.namespaces[this.element.type.namespace]) {
						namespaces.unshift({
							prefix: "",
							uri: this.element.type.namespace
						});
					}
					return this.element.type.name;
				}
			} else if (prefix) {
				return prefix + ":" + this.element.type.name;
			} else {
				return this.element.type.name;
			}
		}).call(this);
		rv.attributes = (function() {
			if (this.element.attributes.length == 0) return "";
			return " " + this.element.attributes.map(function(attribute) {
				if (attribute.namespace && typeof(scope[attribute.namespace]) == "undefined") {
					var hasPrefix = function(prefix) {
						for (var i=0; i<namespaces.length; i++) {
							if (namespaces[i].prefix == prefix) return true;
						}
						return false;
					};
					var index = 0;
					while(hasPrefix("jsdom_" + index)) {
						index++;
					}
					namespaces.push({
						prefix: "jsdom_" + index,
						uri: attribute.namespace
					});
					scope[attribute.namespace] = "jsdom_" + index;
				}
				var ns = (attribute.namespace) ? scope[attribute.namespace] + ":" : "";
				return ns + attribute.name + "=" + "\"" + attribute.value + "\"";
			}).join(" ");
		}).call(this);
		rv.content = this.children.map(function(child) {
			var params = {};
			for (var x in m) {
				params[x] = m[x];
			}
			params.namespaces = scope;
			return child.serialize(params);
		}).join("");
		rv.namespaces = (function() {
			if (namespaces.length == 0) return "";
			return " " + namespaces.map(function(namespace) {
				return ((namespace.prefix) ? "xmlns:" + namespace.prefix : "xmlns")
					+ "=" + "\"" + namespace.uri + "\""
				;
			}).join(" ");
		})();
		var start = "<" + rv.name + rv.namespaces + rv.attributes;
		if (!rv.content) {
			if (m.empty) {
				var format = m.empty.call(this);
				if (!format || (format && format.empty)) {
					return start + "/>";
				} else if (format && format.xhtml) {
					return start + " />";
				}
				//	If object that is not empty and not xhtml, fall through to start-end model
			} else {
				return start + "/>";
			}
		}
		//	TODO	allow empty element model
		return start + ">" + rv.content + "</" + rv.name + ">";
	};
};

var Doctype = function(p) {
	Node.call(this,p);
	//	TODO	implement entities
	//	TODO	implement notations
	//	TODO	implement internal subset
	if (p.name === null) throw new TypeError();
	if (p.publicId === null) throw new TypeError();
	if (p.systemId === null) throw new TypeError();
	
	this.doctype = {
		name: p.name,
		publicId: p.publicId,
		systemId: p.systemId
	};
	
	this.serialize = function() {
		var quote = function(s) {
			return "\"" + s + "\"";
		};
		return "<!DOCTYPE " + this.doctype.name + " " + quote(this.doctype.publicId) + " " + quote(this.doctype.systemId) + ">";
	};
};

var Document = function(p) {
	Node.call(this,p);
	Parent.call(this,p);
	
	var self = this;
	
	this.document = new function() {
		this.getElement = function() {
			return self.child(function(node) {
				return Boolean(node.element);
			});
		};
		
		this.getType = function() {
			return self.child(function(node) {
				return Boolean(node.doctype);
			});
		}
	};
	
	//	TODO	decide whether to emit XML prologue
	this.serialize = function(m) {
		return this.children.map(function(child) { return child.serialize(m); }).join("");
	}
};

$exports.Document = Document;
$exports.Doctype = Doctype;
$exports.Element = Element;
$exports.Text = Text;
$exports.Cdata = Cdata;
$exports.Comment = Comment;

$exports.filter = function(p) {
	if (typeof(p) == "object" && typeof(p.elements) == "string") {
		return function(node) {
			return node && node.element && node.element.type.name == p.elements;
		};
	}
};