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

	this.search = function(search) {
		search = asSearch(search);
		var rv = [];
		traverse(rv,this.children,search);
		return rv;
	};

	this.identify = function(search) {
		search = asSearch(search);
		var rv = [];
		traverse(rv,this.children,search);
		return choose(rv);
	};

	this.child = function(filter) {
		var rv = this.children.filter(filter);
		return choose(rv);
	}

	this.remove = $api.experimental(function(search) {
		search = asSearch(search);
		for (var i=0; i<this.children.length; i++) {
			if (search.filter(this.children[i])) {
				this.children.splice(i,1);
				i--;
			} else {
				if (this.children[i].remove && search.descendants(this.children[i])) {
					this.children[i].remove(search);
				}
			}
		}
	});

	this.get = $api.deprecate(function(p) {
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
	});
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
		var escape = (m && m.escape) ? m.escape : null;
		if (escape == "none") return this.text.data;
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

var ProcessingInstruction = function(p) {
	this.target = p.instruction.target;
	this.data = p.instruction.data;

	this.serialize = function(m) {
		return "<?" + this.target + " " + this.data + "?>";
	}
}

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
			if (typeof(p) == "string") {
				this.push({
					//	TODO	namespace?
					name: p,
					value: v
				})
			} else {
				this.push({
					namespace: p.namespace,
					name: p.name,
					value: v
				});
			}
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
		var scope = {
			"http://www.w3.org/XML/1998/namespace": "xml"
		};
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
			//	TODO	bug: should check for typeof(this.element.type.namespace); this fails when specifying empty namespace
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
				if (attribute.namespace && typeof(scope[attribute.namespace]) == "undefined" && !/^(xX)(mM)(lL)/.test(attribute.namespace)) {
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
				return ns + attribute.name + "=" + "\"" + attribute.value.replace(/\"/g, "&quot;").replace(/\</g, "&lt;").replace(/\&/g, "&amp;") + "\"";
			}).join(" ");
		}).call(this);
		var isUnescapedScript = this.element.type.name == "script" && m.doNotEscapeScript;
		rv.content = this.children.map(function(child) {
			var params = {};
			for (var x in m) {
				params[x] = m[x];
			}
			if (params.pretty) {
				params.pretty = {
					current: m.pretty.current + m.pretty.indent,
					indent: m.pretty.indent
				}
			}
			params.namespaces = scope;
			if (isUnescapedScript) params.escape = "none";
			return child.serialize(params);
		}).join("");
		rv.namespaces = (function() {
			var toDeclare = namespaces.filter(function(item) {
				if (m.namespaces[item.uri] === item.prefix) return false;
				return true;
			});
			if (toDeclare.length == 0) return "";
			return " " + toDeclare.map(function(namespace) {
				return ((namespace.prefix) ? "xmlns:" + namespace.prefix : "xmlns")
					+ "=" + "\"" + namespace.uri + "\""
				;
			}).join(" ");
		})();
		var prefix = (function() {
			if (m.pretty) {
				return m.pretty.current;
			} else {
				return "";
			}
		})();
		var start = prefix + "<" + rv.name + rv.namespaces + rv.attributes;
		if (!rv.content) {
			if (m.empty) {
				var format = m.empty(this);

				var deprecatedForm = function(string) {
					return $api.deprecate(function() {
						return string;
					})();
				}

				if (!format || (format && format.empty)) {
					return deprecatedForm(start + "/>");
				} else if (format && format.xhtml) {
					return deprecatedForm(start + " />");
				} else if (typeof(format.selfclose) != "undefined") {
					if (typeof(format.selfclose) == "object" && format.selfclose.xhtml) {
						return start + " />";
					} else if (format.selfclose === true) {
						return start + "/>";
					} else {
						return start + ">" + "</" + rv.name + ">";
					}
				} else {
					//	If object that is not empty and not xhtml, fall through to start-end model
					return start + ">" + rv.content + "</" + rv.name + ">";
				}
			} else {
				return start + "/>";
			}
		} else {
			var endprefix = (function() {
				for (var i=0; i<this.children.length; i++) {
					if (this.children[i].element) return prefix;
				}
				return "";
			}).call(this);
			return start + ">" + rv.content + endprefix + "</" + rv.name + ">";
		}
	};
};

var Doctype = function(p) {
	Node.call(this,p);
	//	TODO	implement entities
	//	TODO	implement notations
	//	TODO	implement internal subset
	if (p.name === null) throw new TypeError();

	this.doctype = {
		name: p.name
	};

	//	TODO	verify how these are supposed to work; are they optional? We used to enforce their presence but NekoHTML does not
	//			provide them for at least some parsed HTML pages
	["publicId","systemId"].forEach(function(property) {
		if (typeof(p[property]) != "undefined" && p[property] !== null) {
			this.doctype[property] = p[property];
		}
	}, this);

	this.serialize = function(m) {
		var type = (function(public,system) {
			if (public) return { type: "PUBLIC", string: public };
			if (system) return { type: "SYSTEM", string: system };
			return null;
		})(this.doctype.publicId,this.doctype.systemId);

		var quote = function(s) {
			return "\"" + s + "\"";
		};

		var tokens = [this.doctype.name];

		var type = (function() {
			if (this.doctype.publicId) return "PUBLIC";
			if (this.doctype.systemId) return "SYSTEM";
			return null;
		}).call(this);

		tokens.push(type);

		if (this.doctype.publicId) tokens.push(quote(this.doctype.publicId));
		if (this.doctype.systemId) tokens.push(quote(this.doctype.systemId));

		return "<!DOCTYPE " + tokens.join(" ") + ">\n";
	};
};

var emptySerializers = new function() {
	//	See HTML4 "Index of Elements"
	var html4empty = ["area","base","basefont","br","col","frame","hr","img","input","isindex","link","meta","param"];
	//	See HTML5 section 8.1.2
	var html5void = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "menuitem", "meta", "param", "source", "track", "wbr"];
	this.xhtml = function(element) {
		var empty = html4empty.indexOf(element.element.type.name) != -1 && html5void.indexOf(element.element.type.name) != -1;
		if (empty) {
			return { selfclose: { xhtml: true } };
		} else if (element.element.type.namespace == "http://www.w3.org/1999/xhtml") {
			return { selfclose: false };
		} else {
			return { selfclose: { xhtml: true } };
		}
	};

	this.html5 = function(element) {
		var empty = html4empty.indexOf(element.element.type.name) != -1 && html5void.indexOf(element.element.type.name) != -1;
		return (empty) ? { selfclose: { xhtml: true } } : { selfclose: false };
	}
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
		if (!m) m = {};
		var parameters = {};
		for (var x in m) {
			parameters[x] = m[x];
		}
		if (!parameters.empty) {
			if (this.document.getElement().element.type.namespace == "http://www.w3.org/1999/xhtml") {
				parameters.empty = emptySerializers.xhtml;
				parameters.doNotEscapeScript = true;
			} else if (this.document.getType() && this.document.getType().doctype.name == "html") {
				parameters.empty = emptySerializers.html5;
				parameters.doNotEscapeScript = true;
			}
		}
		return this.children.map(function(child) { return child.serialize(parameters); }).join("");
	}
};

$exports.Document = Document;
$exports.Doctype = Doctype;
$exports.Element = Element;
$exports.Text = Text;
$exports.Cdata = Cdata;
$exports.Comment = Comment;
$exports.ProcessingInstruction = ProcessingInstruction;

$exports.filter = function(p) {
	if (typeof(p) == "object" && typeof(p.elements) == "string") {
		return function(node) {
			return node && node.element && node.element.type.name == p.elements;
		};
	}
	if (typeof(p) == "object" && typeof(p.attribute) != "undefined") {
		return function(node) {
			if (typeof(p.value) != "undefined") {
				return node.element && node.element.attributes.get(p.attribute) == p.value;
			} else {
				return node.element && node.element.attributes.get(p.attribute) != null;
			}
		}
	}
};