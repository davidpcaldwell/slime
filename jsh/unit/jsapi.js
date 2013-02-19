//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var getApiHtml = function(moduleMainPathname) {
	//	TODO	logic for this is largely duplicated in loader/api/api.html.js getApiHtmlPath method, which is string based while
	//			this is pathname- and directory- and file- based
	if (moduleMainPathname.directory) {
		return moduleMainPathname.directory.getFile("api.html");
	} else if (moduleMainPathname.file) {
		var basename = moduleMainPathname.file.pathname.basename;
		var directory = moduleMainPathname.file.parent;
		var jsName = /(.*)\.js$/.exec(basename);
		if (/api\.html$/.test(basename)) {
			return moduleMainPathname.file;
		} else if (/^api\.(.*)\.html$/.test(basename)) {
			return moduleMainPathname.file;
		} else if (jsName) {
			return directory.getFile(jsName[1]+".api.html");
		} else {
			return directory.getFile(basename+".api.html");
		}
	}
}

var Jsdom = function(base,dom) {
	var Element = function(delegate,parent) {
		if (!delegate.name) {
			debugger;
			throw new Error();
		}
		
		var map = function(query,parent) {
			return query.map(function(e) {
				return new Element(e,parent);
			});
		}

		this.localName = delegate.name.local;
		
		this.getAttribute = function(name) {
			return delegate.getAttribute({
				namespace: "",
				name: name
			});
		};
		
		this.getJsapiAttribute = function(name) {
			return delegate.getAttribute({
				namespace: "http://www.inonit.com/jsapi",
				name: name
			});
		}
		
		this.getContentString = function() {
			return delegate.get().map(function(node) {
				if (node.data) return node.data;
				return String(node);
			}).join("");
		}

		var children;

		this.getChildren = function() {
			if (!children) {
				children = map(delegate.get({
					filter: function(e) {
						return Boolean(e.name);
					}
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
			delegate.set(other.$jsdom.get());
			children = null;
		}

		this.removeJsapiAttribute = function(name) {
			delegate.setAttribute({
				namespace: "http://www.inonit.com/jsapi",
				name: name
			}, null);
		}

		//	Unclear whether below used

		this.toString = function() {
			throw new Error();
			return xml.toXMLString();
		}
	}
	
	this.top = new Element(dom.get({
		filter: function(e) {
			return Boolean(e.name);
		}
	})[0]);
	
	this.load = function(path) {
		var file = base.getFile(path);
		if (file == null) {
			throw new Error("Cannot find referenced file at " + path + " from base: " + base);
		} else {
			jsh.shell.echo("Loading " + path + " from " + base);
		}
		return loadApiHtml(base.getFile(path));		
	}
};

var loadApiHtml = function(file) {
	if (!arguments.callee.cache) {
		arguments.callee.cache = {};
	}
	if (!arguments.callee.cache[file.pathname.toString()]) {
		arguments.callee.cache[file.pathname.toString()] = (function() {
			if (false) jsh.shell.echo("Reading api.html: " + file.pathname);
			var doc = new $context.jsdom.Rhino.Document({
				stream: file.read(jsh.io.Streams.binary)
			});
			return new Jsdom(file.parent,doc);
		})();
	} else {
		jsh.shell.echo("Returning cached api.html: " + file.pathname);
	}
	return arguments.callee.cache[file.pathname.toString()];
}

$exports.tests = new function() {
	var testGroups = [];

	var moduleToItem = function(moduleDescriptor,unit) {
		return new function() {
			this.name = moduleDescriptor.location.toString();

			if (!moduleDescriptor.location.directory && !moduleDescriptor.location.file) {
				throw new Error("Not found: " + moduleDescriptor.location);
			}
			var apiHtmlFile = getApiHtml(moduleDescriptor.location);
			if (apiHtmlFile) {
				var page = loadApiHtml(apiHtmlFile);

				var name = moduleDescriptor.path;
				if (unit) {
					name += "." + unit;
				}
				this.html = new $context.html.ApiHtmlTests(page,name);
				this.getScenario = function(scope) {
					return this.html.getScenario(scope,unit);
				}
			}

			this.namespace = moduleDescriptor.namespace;

			this.loadWith = function(context) {
				if (/\.html/.test(moduleDescriptor.location.basename)) {
					return {};
				} else {
					return jsh.loader.module(moduleDescriptor.location, (context) ? context : {});
				}
			}

			this.getRelativePath = function(path) {
				return getApiHtml(moduleDescriptor.location).getRelativePath(path);
			}

			this.getResourcePathname = function(path) {
				if (moduleDescriptor.location.directory) return moduleDescriptor.location.directory.getRelativePath(path);
				if (moduleDescriptor.location.file) return moduleDescriptor.location.file.parent.getRelativePath(path);
				throw new Error("Unimplemented");
			}
		}
	}

	this.add = function(module,unit) {
		testGroups.push(moduleToItem(module,unit));
	}

	this.run = function(successWas) {
		var $scenario = {};
		$scenario.name = "Unit tests";
		var suites = [];
		$scenario.execute = function(topscope) {
			jsh.shell.echo("Environments present: " + Object.keys($context.ENVIRONMENT));
			//	var item is expected to be $scope.$unit
			suites.forEach( function(suite) {
				var $newTemporaryDirectory = function() {
					var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
					var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
					var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
					dir.mkdirs();
					return dir;
				}

				var scope = {
					$jsapi: {
						module: function(name,context) {
							if (typeof(name) == "object" && typeof(context) == "string") {
								jsh.shell.echo("DEPRECATED: $jsapi.module(" + arguments[1] +") called with context,name");
								return arguments.callee.call(this,arguments[1],arguments[0]);
							}
							if (false) {
								var MODULES = $context.MODULES;
								if (MODULES[name+"/"]) {
									//	Forgot trailing slash; fix; this ability may later be removed
									debugger;
									name += "/";
								}
								if (!MODULES[name]) {
									debugger;
									return null;
								}
								return jsh.loader.module(MODULES[name].location,context);
							} else {
								return jsh.loader.module(suite.getRelativePath(name),context);
							}
						},
						//	TODO	Probably the name of this call should reflect the fact that we are returning a native object
						environment: $context.ENVIRONMENT,
						newTemporaryDirectory: function() {
							var $path = $newTemporaryDirectory();
							var pathstring = String($path.getCanonicalPath());
							var os = jsh.file.filesystems.os.Pathname(pathstring);
							return (jsh.file.filesystems.cygwin) ? jsh.file.filesystems.cygwin.toUnix(os).directory : os.directory;
						},
						disableBreakOnExceptions: function(f) {
							return function() {
								var isBreak = $host.getDebugger().isBreakOnExceptions();
								$host.getDebugger().setBreakOnExceptions(false);
								var rv = f.apply(this,arguments);
								$host.getDebugger().setBreakOnExceptions(isBreak);
								return rv;
							}
						}
					},
					$java: {
						io: {
							newTemporaryDirectory: $newTemporaryDirectory
						}
					},
					$module: new function() {
						this.getResourcePathname = function(path) {
							return suite.getResourcePathname(path);
						}
					},
					$platform: jsh.$jsapi.$platform,
					$api: jsh.$jsapi.$api
				};

				var contexts = (suite.html) ? suite.html.getContexts(scope) : [{}];

				for (var i=0; i<contexts.length; i++) {
					try {
						if (suite.getScenario) {
							scope.module = suite.loadWith(contexts[i]);
							scope.context = contexts[i];
							var scenario = suite.getScenario(scope);
							scenario.name += " " + ((contexts[i].id) ? contexts[i].id : String(i));
							topscope.scenario( scenario );
						} else {
							topscope.scenario(new function() {
								this.name = suite.name + " (NO TESTS)";

								this.execute = function(scope) {
									scope.test({
										success: false,
										messages: {
											failure: suite.name + " has no api.html file containing tests."
										}
									});
								}
							})
						}
					} catch (e) {
						//	Do not let initialize() throw an exception, which it might if it assumes we successfully loaded the module
						topscope.scenario(new function() {
							this.name = suite.name;

							this.execute = function(scope) {
								throw e;
							}
						});
					}
				}
			} );
		}

		testGroups.forEach( function(item) {
			jsh.shell.echo("Processing: " + item.name + ((item.namespace) ? (" " + item.namespace) : ""));
			suites.push(item);
		} );

		var SCENARIO = new $context.Scenario($scenario);
		successWas(SCENARIO.run( $context.console ));
	}
}

$exports.doc = function(p) {
	var modules = p.modules;
	var to = p.to;

	var destination = to.createDirectory({
		ifExists: function(dir) {
			dir.remove();
			return true;
		},
		recursive: true
	});

	["api.css","api.js"].forEach( function(name) {
		destination.getRelativePath(name).write($context.api.getFile(name).read(jsh.io.Streams.binary));
	});

	XML.ignoreWhitespace = false;
	XML.prettyPrinting = false;

	var index = new $context.jsdom.Rhino.Document({
		stream: $context.jsapi.getFile("index.html").read(jsh.io.Streams.binary)
	});

	//	TODO	parameterize the below rather than hard-coding
	//	TODO	apparent Rhino 1.7R3 bug which requires the given subscripting; should be able to do index.head.title = "..."
	var title = index.get({
		filter: $context.jsdom.filter({ name: "title" }),
		recursive: true
	})[0];
	var h1 = index.get({
		filter: $context.jsdom.filter({ name: "h1" }),
		recursive: true
	})[0];
	title.set([ new $context.jsdom.Text("API Documentation" )]);
	h1.set([ new $context.jsdom.Text("API Documentation") ]);

	index.get({
		filter: $context.jsdom.filter({ name: "tbody" }),
		recursive: true
	})[0].set([]);

	//	TODO	find a way to deprecate this object, which is being used in eval() using hard-coded "absolute" paths in
	//			jsapi:reference expressions
	var doc = {};

	modules.forEach( function(item) {
		var xhtml = getApiHtml(item.location).read(XML);
		doc[item.path] = xhtml;
	});

	var ApiHtml = function(p) {
		//	TODO	disentangle all this recursion and 'this'-manipulation
		var root = new $context.jsdom.Rhino.Document({
			stream: p.file.read(jsh.io.Streams.binary)
		}).get({
			filter: function(e) {
				return Boolean(e.name);
			}
		})[0];

		this.getApi = function(path) {
			var pathname = p.file.getRelativePath(path);
			return new ApiHtml({
				file: getApiHtml(pathname)
			});
		}

		var getElement = function(e,declaration) {
			if (!e.getAttribute) {
				throw new TypeError("No getAttribute in " + e + " with keys " + Object.keys(e));
			}
			var reference = e.getAttribute({
				namespace: "http://www.inonit.com/jsapi",
				name: "reference"
			});
			if (reference) {
				try {
					var getApi = function(path) {
						return declaration.getApi(path);
					}
					return eval(reference);
				} catch (e) {
					var _e = e;
					debugger;
					var error = new EvalError("Error evaluating reference: " + reference);
					var string = String(reference);
					error.string = string;
					error.toString = function() {
						return this.message + "\n" + this.string;
					}
					//	Below appears to decide whether to halt on incorrect reference
					if (true) {
						throw error;
					} else {
						return new $context.jsdom.Element({
							name: {
								local: "x"
							}
						});
					}
				}				
			}
			return e;
		}

		this.getElement = function(path) {
			var tokens = path.split("/");
			var rv = root;
			for (var i=0; i<tokens.length; i++) {
				rv = rv.get({
					filter: function(e) {
						return e.getAttribute && e.getAttribute({
							namespace: "http://www.inonit.com/jsapi",
							name: "id"
						}) == tokens[i]
					},
					descendants: function(e) {
						//	TODO	obviously a function like this should return true if it is a document as well, but it will only
						//			be called for children, and a document should never be a child
						return e.getAttribute && e.getAttribute({
							namespace: "http://www.inonit.com/jsapi",
							name: "id"
						}) == null;
					}
				})[0];
				if (typeof(rv) == "undefined") {
					return null;
				}
			}
			return getElement(rv,this);
		}

		this.resolve = function(element) {
			return getElement(element,this);
		}
	}

	modules.forEach( function(item) {
		if (item.ns) {
			jsh.shell.echo("Generating documentation for " + item.ns + " from module at " + item.location + " ...");
			var file = getApiHtml(item.location);
			var path = (function() {
				var rv = file.pathname.basename;
				var dir = file.pathname.parent.directory;
				while(dir.pathname.toString() != item.base.pathname.toString()) {
					rv = dir.pathname.basename + "/" + rv;
					dir = dir.pathname.parent.directory;
				}
				return rv;
			})();
			//	TODO	it would be nice to get the below from the document itself like we did with E4X
			var ns = "http://www.w3.org/1999/xhtml";
			var jsdom = $context.jsdom;
			var document = new jsdom.Rhino.Document({ stream: file.read(jsh.io.Streams.binary) });
			var top = (function() {
				//	below could be simplified with join and map but we leave it this way until we make sure all cases work; e.g.,
				//	path ending with /, path ending with filename
				var tokens = item.path.split("/");
				var rv = "";
				for (var i=0; i<tokens.length-1; i++) {
					rv += "../";
				}
				return rv;
			})();
			var root = document.get(jsdom.filter({ name: "html" }))[0];

			var head = root.get(jsdom.filter({ name: "head" }))[0];
			var css = head.get(function(node) {
				return node.name && node.name.local == "link" && /api\.css$/.test(node.getAttribute("href"));
			})[0];
			if (css) {
				head.remove(css);
			}
			head.append(new jsdom.Element({
				name: {
					namespace: ns,
					local: "link"
				},
				attributes: [
					{ local: "rel", value: "stylesheet" },
					{ local: "type", value: "text/css" },
					{ local: "href", value: top + "api.css" }
				]
			}));
			var js = head.get(function(node) {
				return node.name && node.name.local == "script" && /api\.js$/.test(node.getAttribute("src"));
			})[0];
			if (js) {
				head.remove(js);
			}
			head.append(new jsdom.Element({
				name: {
					namespace: ns,
					local: "script"
				},
				attributes: [
					{ local: "type", value: "text/javascript" },
					{ local: "src", value: top + "api.js" }
				]
			}));

			var body = root.get(jsdom.filter({ name: "body" }))[0];
			body.insert(new jsdom.Element({
				name: {
					namespace: ns,
					local: "a"
				},
				attributes: [
					{ local: "href", value: top + "index.html" }
				],
				children: [
					new jsdom.Text("Documentation Home")
				]
			}), { index: 0 });

			var apiSpecificationMarkers = body.get({
				recursive: true,
				filter: jsdom.filter({ id: "template.body" })
			});
			if (apiSpecificationMarkers.length == 0) {
				var contextDiv = body.get({
					//	TODO	probably need to be able to return STOP or something from filter to stop searching below a certain element
					//	TODO	may want to look into xpath
					recursive: true,
					filter: function(node) {
						if (!node.name) return false;
						var elements = node.get(function(child) {
							return Boolean(child.name);
						});
						if (elements[0] && elements[0].name.local == "h1") {
							if (elements[0].get()[0] && elements[0].get()[0].toString() == "Context") {
								return true;
							} else {
								return false;
							}
						} else {
							return false;
						}
					}
				})[0];
				if (contextDiv) {
					body.remove({
						recursive: true,
						node: contextDiv
					});
				}
			}

			//	TODO	document and enhance this ability to import documentation from other files
			var declaration = new ApiHtml({ file: getApiHtml(item.location) });
			var withJsapiReference = root.get({
				recursive: true,
				filter: function(node) {
					return node.getAttribute && node.getAttribute({
						namespace: "http://www.inonit.com/jsapi",
						name: "reference"
					}) != null;
				}
			});
			for (var i=0; i<withJsapiReference.length; i++) {
				var e = withJsapiReference[i];
				var resolved = declaration.resolve(e);
				if (resolved) {
					while(e.get().length) {
						e.remove(e.get()[0]);
					}
					var nodes = resolved.get();
					nodes.forEach(function(node) {
						e.append(node);
					});
				} else {
					throw new Error("Could not resolve reference in: " + e);
				}
			}

			destination.getRelativePath(path).write(document.toString(), { recursive: true });
			
			var tbody = index.get({
				filter: jsdom.filter({ name: "tbody" }),
				recursive: true
			})[0];

			tbody.append(new jsdom.Element({
				name: {
					namespace: ns,
					local: "tr"
				},
				children: [
					new jsdom.Element({
						name: {
							namespace: ns,
							local: "td"
						},
						children: [
							new jsdom.Element({
								name: {
									namespace: ns,
									local: "a"
								},
								attributes: [
									{ local: "href", value: path }
								],
								children: [
									new jsdom.Text(item.ns)
								]
							})
						]
					}),
					new jsdom.Element({
						name: {
							namespace: ns,
							local: "td"
						},
						children: [
							new jsdom.Text(document.get({ filter: jsdom.filter({ name: "title"}), recursive: true })[0].get()[0].toString())
						]
					})
				]
			}));
		}
	});

	destination.getRelativePath("index.css").write(
		$context.jsapi.getFile("index.css").read(jsh.io.Streams.binary),
		{ append: false }
	);
	destination.getRelativePath("index.html").write(String(index));
}