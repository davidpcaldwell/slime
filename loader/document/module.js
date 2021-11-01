//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { any } Packages
	 * @param { any } $platform
	 * @param { slime.$api.Global } $api
	 * @param { slime.runtime.document.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.runtime.document.Export> } $export
	 */
	function(Packages,$platform,$api,$context,$loader,$export) {
		var parsers = {};

		var global = (function() { return this; })();

		if (global.window == global) {
			var parseDom = function(unparsed) {
				if (window.DOMParser) return new DOMParser().parseFromString(unparsed, "text/html");

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

				this.attributes = new function() {
					this.get = function(p) {
						if (typeof(p) == "string") {
							return dom.getAttribute(p);
						} else {
							throw new TypeError("Unsupported: attribute specifier other than string");
						}
					}
				}
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

				this.serialize = function() {
					return Array.prototype.slice.call(p.dom.childNodes).map(function(node) {
						if (node.outerHTML) return node.outerHTML;
						if (node.nodeType == node.DOCUMENT_TYPE_NODE) {
							//	TODO	will need public ID and system ID
							return "<!DOCTYPE " + node.name + ">";
						}
						return "";
					}).join("");
				}
			};

			parsers.browser = function(html) {
				return new Document({ dom: parseDom(html) });
			}
		}

		if ($platform.java && $platform.java.getClass("org.jsoup.Jsoup")) {
			(
				function() {
					/** @type { (f: (p: any) => any ) => (() => any) } */
					var noarg = function(f) {
						return function() {
							return f(void(0));
						}
					};

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
							get: noarg($api.Function.pipe(function() {
								return p.jsoup.attr("name");
							}, $context.$slime.java.adapt.String)),
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
						var jsoup = p.jsoup;
						var name = $context.$slime.java.adapt.String(jsoup.tagName());

						Object.defineProperty(this, "name", {
							value: name,
							enumerable: true
						});

						this.attributes = new function() {
							this.get = function(p) {
								if (typeof(p) == "string") {
									if (!jsoup.hasAttr(p)) return null;
									return String(jsoup.attr(p));
								} else {
									throw new TypeError("Unsupported: attribute specifier other than string");
								}
							}
						}
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
									get: noarg($api.Function.pipe(
										$api.Function.returning(parent.children),
										function(array) {
											return array.filter(filters.element);
										},
										function(array) {
											if (array.length > 1) throw new Error();
											if (array.length == 0) return null;
											return array[0];
										}
									)),
									enumerable: true
								})
							})(this);

							Object.defineProperty(this, "document", {
								value: document,
								enumerable: true
							});

							this.serialize = function() {
								this.jsoup.outputSettings(
									new Packages.org.jsoup.nodes.Document.OutputSettings().prettyPrint(false)
								);
								return this.jsoup.outerHtml();
							};
						};

						return function(html) {
							return new Document({ jsoup: Packages.org.jsoup.Jsoup.parse(html) });
						};
					})();
				}
			)();
		}

		var parser = (function() {
			if (parsers.browser) return parsers.browser;
			if (parsers.jsoup) return parsers.jsoup;
		})();

		/** @type { slime.runtime.document.source.Export } */
		var source = $loader.file("source.js");

		/** @type { slime.runtime.document.Export } */
		var rv = {
			load: function(p) {
				if (!parser) throw new Error("Parser not found.");
				if (p.loader && p.path) {
					var html = p.loader.get(p.path).read(String);
					return parser(html);
				} else if (p.string) {
					return parser(p.string);
				} else {
					throw new TypeError();
				}
			},
			codec: {
				document: {
					decode: function(string) {
						return source.parse({ string: string });
					},
					encode: function(document) {
						return source.serialize({ document: document });
					}
				}
			},
			Node: source.Node,
			//	TODO	temporarily disabling TypeScript while we figure out the loader/document vs. rhino/document nightmare
			//@ts-ignore
			Document: {
				removeWhitespaceTextNodes: function(document) {
					/**
					 * @template { slime.runtime.document.Node } T
					 * @param { T } node
					 * @returns { T }
					 */
					var convert = function(node) {
						var copy = $api.Object.compose(node);
						if (source.Node.isParent(copy)) {
							copy.children = copy.children.filter(function(node) {
								return !(source.Node.isText(node) && !node.data.trim())
							}).map(convert)
						}
						return copy;
					};

					return convert(document);
				},
				prettify: function(p) {
					/**
					 *
					 * @param { string } data
					 * @returns { slime.runtime.document.Text }
					 */
					function text(data) {
						return {
							type: "text",
							data: data
						}
					}

					/**
					 * @template { slime.runtime.document.Node } T
					 * @param { T } node
					 * @returns { T }
					 */
					function convert(node,depth) {
						var copy = $api.Object.compose(node);
						if (source.Node.isElement(copy)) {
							copy.children = copy.children.filter(function(node) {
								return !(source.Node.isText(node) && !node.data.trim())
							});
							/** @type { slime.runtime.document.Node[] } */
							var result = [];
							copy.children = copy.children.reduce(function(rv,child,index,children) {
								rv.push(text("\n" + $api.Function.string.repeat(depth+1)(p.indent)));
								rv.push(convert(child,depth+1));
								if (index+1 == children.length) {
									rv.push(text("\n" + $api.Function.string.repeat(depth)(p.indent)));
								}
								return rv;
							},result);
						}
						return copy;
					}

					return function(document) {
						return {
							type: "document",
							children: document.children.map(function(child) {
								return convert(child,0);
							})
						}
					}
				}
			}
		};

		$export(rv);
	}
//@ts-ignore
)(Packages,$platform,$api,$context,$loader,$export);
