//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.document.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.document.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$loader,$export) {
		/** @type { Partial<slime.jrunscript.document.Exports> } */
		var $exports = {};
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
			} else if (_node.getNodeType() == Packages.org.w3c.dom.Node.PROCESSING_INSTRUCTION_NODE) {
				rv = new $context.pure.ProcessingInstruction({ instruction: { target: String(_node.getTarget()), data: String(_node.getData()) }});
			} else {
				throw new Error("Unknown node type: " + _node + " type=" + _node.getNodeType());
			}
			var _children = _node.getChildNodes();
			for (var i=0; i<_children.getLength(); i++) {
				rv.children.push(toNode(_children.item(i)));
			}
			return rv;
		}

		$exports.Document = Object.assign(function(p) {
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
				//	TODO	currently undocumented
				return parse(new Packages.org.xml.sax.InputSource(p.file.resource.read.binary().java.adapt()));
			} else if (p._document) {
				return toNode(p._document);
			} else {
				throw new TypeError();
			}
		});

		var html = $loader.module("parser.js", {
			api: {
				java: $context.api.java
			}
		});

		$exports.Document.Html = function(p) {
			var parameter = {};
			if (p.string) {
				parameter.string = html.xhtml({ string: p.string });
			}
			return new $exports.Document(parameter);
		};
		Object.defineProperty(
			$exports.Document.Html,
			"$reload",
			{
				value: function() {
					html.reload();
				}
			}
		);
		Object.defineProperty(
			$exports.Document.Html,
			"parser",
			{
				get: function() {
					return html.xhtml.id;
				}
			}
		);

		["namespace","Doctype","Element","Text","Cdata","Comment","filter"].forEach(function(name) {
			$exports[name] = $context.pure[name]
		});

		$export( /** @type { slime.jrunscript.document.Exports } */ ($exports));
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$loader,$export);
