//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the Java interface to the SLIME document API.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	this name should be reviewed if we start supporting Nashorn
var toNamespace = function(v) {
	return (v) ? String(v) : "";
}

var toElement = function(_element) {
	var p = {};
	//	TODO	do some unit tests to figure this out
	if (_element.getTagName() && !_element.getLocalName()) {
		p.type = {
			namespace: "",
			name: String(_element.getTagName())
		}
	} else {
		p.type = {
			namespace: toNamespace(_element.getNamespaceURI()),
			name: String(_element.getLocalName())
		};
	}
	p.namespaces = [];
	p.attributes = [];
	for (var i=0; i<_element.getAttributes().getLength(); i++) {
		var _attribute = _element.getAttributes().item(i);
		var ns = toNamespace(_attribute.getNamespaceURI());
		var name = String(_attribute.getLocalName());
		var value = String(_attribute.getValue());
		if (name == "xmlns") {
			p.namespaces.push({
				prefix: "",
				uri: value
			});
		} else if (ns == "http://www.w3.org/2000/xmlns/") {
			p.namespaces.push({
				prefix: name,
				uri: value
			});
		} else {
			p.attributes.push({
				namespace: ns,
				name: name,
				value: value
			});
		}
	}
	return new $context.pure.Element(p);
}

var toNode = function(_node) {
	var rv;
	if (_node.getNodeType() == Packages.org.w3c.dom.Node.DOCUMENT_NODE) {
		rv = new $context.pure.Document();
	} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.ELEMENT_NODE) {
		rv = toElement(_node);
	} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.TEXT_NODE) {
		rv = new $context.pure.Text({ text: String(_node.getNodeValue()) });
	} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.COMMENT_NODE) {
		rv = new $context.pure.Comment({ comment: String(_node.getNodeValue()) });
	} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.CDATA_SECTION_NODE) {
		rv = new $context.pure.Cdata({ cdata: String(_node.getNodeValue()) });
	} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.DOCUMENT_TYPE_NODE) {
		var toJs = function(s) {
			if (s === null) return null;
			return String(s);
		};

		rv = new $context.pure.Doctype({
			name: toJs(_node.getName()),
			publicId: toJs(_node.getPublicId()),
			systemId: toJs(_node.getSystemId())
		});
	} else {
		throw new Error("Unknown node type: " + _node);
	}
	var _children = _node.getChildNodes();
	for (var i=0; i<_children.getLength(); i++) {
		rv.children.push(toNode(_children.item(i)));
	}
	return rv;
}

$exports.Document = function(p) {
	var parse = function(_source) {
		var _jaxpFactory = Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance();
		_jaxpFactory.setNamespaceAware(true);
		var _jaxp = _jaxpFactory.newDocumentBuilder();
		_jaxp.setEntityResolver(new JavaAdapter(
			Packages.org.xml.sax.EntityResolver,
			new function() {
				this.resolveEntity = function() {
					//	TODO	this dependency is obviously not ideal
					return new Packages.org.xml.sax.InputSource(Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM);
				}
			}
		));
		var _dom = _jaxp.parse(_source);
		return toNode(_dom);
	};

	if (p.stream) {
		return parse(new Packages.org.xml.sax.InputSource(p.stream.java.adapt()));
	} else if (p.string) {
		return parse(new Packages.org.xml.sax.InputSource(new Packages.java.io.StringReader(p.string)));
	} else if (p.file) {
		return parse(new Packages.org.xml.sax.InputSource(p.file.resource.read.binary().java.adapt()));
	} else if (p._document) {
		return toNode(p._document);
	} else {
		throw new TypeError();
	}
};

$exports.filter = $context.pure.filter;