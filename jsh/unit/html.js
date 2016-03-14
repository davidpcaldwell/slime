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
	this.toString = function() {
		return "Jsdom: base=" + base + " dom=" + dom;
	}

	var Element = function(delegate,parent) {
		var map = function(query,parent) {
			return query.map(function(e) {
				return new Element(e,parent);
			});
		}

		this.localName = delegate.element.type.name;

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

	this.top = new Element(dom.document.getElement());

	this.load = function(path) {
		var file = base.getFile(path);
		if (file == null) {
			throw new Error("Cannot find referenced file at " + path + " from base: " + base);
		} else {
			//jsh.shell.echo("Loading " + path + " from " + base);
		}
		return loadApiHtml(base.getFile(path));
	}
};

var loadApiHtml = function(file) {
	if (!arguments.callee.cache) {
		arguments.callee.cache = {};
	}
	if (true || !arguments.callee.cache[file.pathname.toString()]) {
		arguments.callee.cache[file.pathname.toString()] = (function() {
			jsh.shell.echo("Loading API file: " + file.pathname);
			var doc = new jsh.document.Document({
				stream: file.read(jsh.io.Streams.binary)
			});
			return new Jsdom(file.parent,doc);
		})();
	} else {
		jsh.shell.echo("Returning cached api.html: " + file.pathname);
	}
	return arguments.callee.cache[file.pathname.toString()];
}

var Suite = function(pathname) {
	return new function() {
		this.name = pathname.toString();

		if (!pathname.directory && !pathname.file) {
			throw new Error("Not found: " + pathname);
		}
		var apiHtmlFile = getApiHtml(pathname);
		if (apiHtmlFile) {
			var page = loadApiHtml(apiHtmlFile);

			var name = pathname.toString();
			this.html = new $context.html.ApiHtmlTests(page,name);
//			this.getScenario = function(scope) {
//				return this.html.getScenario(scope);
//			}
			this.getSuiteDescriptor = function(scope) {
				return this.html.getSuiteDescriptor(scope);
			}
		}

		this.toString = function() {
			return "Suite: name=" + this.name + " page=" + page + " this.html = " + this.html;
		}

//		this.loadWith = function(context) {
//			if (/\.html/.test(pathname.basename)) {
//				return {};
//			} else {
//				return jsh.loader.module(pathname, (context) ? context : {});
//			}
//		}

		this.getRelativePath = function(path) {
			return getApiHtml(pathname).getRelativePath(path);
		}

//		this.getResourcePathname = function(path) {
//			if (pathname.directory) return pathname.directory.getRelativePath(path);
//			if (pathname.file) return pathname.file.parent.getRelativePath(path);
//			throw new Error("Unimplemented");
//		}
	}
}

var Scope = function(suite,environment) {
	var $newTemporaryDirectory = function() {
		var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
		var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
		var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
		dir.mkdirs();
		return dir;
	};

	//	TODO	it appears that for the purpose of this method suite must just support getRelativePath()
	//	TODO	it also uses getResourcePathname; is there any difference? Would a scope created via $jsapi.test support
	//			it? (probably not)
	//	TODO	document $relative if it is used by tests
	this.$relative = function(getRelativePath) {
		return new Scope({ getRelativePath: getRelativePath, getResourcePathname: getRelativePath }, environment);
	};

	var Loader = function(suite) {
		var Implementation = function(suite) {
			this.loader = function(path) {
				var pathname = suite.getRelativePath(path);
				return new jsh.file.Loader({ directory: pathname.directory });
			};

			var Directory = function(directory) {
				this.string = function(path) {
					return directory.getFile(path).read(String);
				}
			}

			this.directory = function(path) {
				var pathname = suite.getRelativePath(path);
				return new Directory(pathname.directory);
			}

			this.coffee = jsh.$jsapi.coffee;

			this.suite = function(path,environment) {
				var apifile = getApiHtml(suite.getRelativePath(path));
				var page = loadApiHtml(apifile);
				var name = path;
				var tests = new $context.html.ApiHtmlTests(page,name);
				//	TODO	currently we are setting this $jsapi.environment.file variable both here and in jsapi.jsh.js to support
				//			HTML pages locating themselves in the file system. This is not good; we shouldn't even be treating them as
				//			files. As of this writing, the only known use is to support the jsh/unit/api.html tests which test HTML
				//			tests themselves.
				var pageEnvironment = jsh.js.Object.set({}, environment, { file: apifile });
				var subscope = new Scope(new Suite(suite.getRelativePath(path)),pageEnvironment);
				var rv = tests.getSuite(subscope);
				return rv;
			}
		};
		
		var implementation = new Implementation(suite);

		var parse = function(path) {
			var index = path.lastIndexOf("/");
			var directory = path.substring(0,index);
			var basename = path.substring(index);
			return {
				directory: directory,
				basename: basename
			};
		};

		["module","file","run","get"].forEach(function(operation) {
			this[operation] = function(name,context,target) {
				var parsed = parse(name);
				return implementation.loader(parsed.directory)[operation](parsed.basename,context,target);
			};
		},this);

		this.eval = function(name,scope) {
			var parsed = parse(name);
			var code = implementation.directory(parsed.directory).string(parsed.basename);
			if (!code) throw new Error("No file at " + code + " path=" + name);
			var scope = (scope) ? scope : {};
			with(scope) {
				return eval(code);
			}
		};

		this.string = function(name) {
			var parsed = parse(name);
			return implementation.directory(parsed.directory).string(parsed.basename);
		};

		this.coffee = implementation.coffee;

		this.suite = function(path,p) {
			return implementation.suite(path,p);
		};
		
		this.getRelativePath = function(path) {
			return suite.getRelativePath(path);
		};
	}

	this.$jsapi = {
		environment: environment,
		loader: new Loader(suite),
		//	TODO	not sure the below should be provided; is used to facilitate loading of jsh plugins into the jsh executing the
		//			tests, but probably need a more granular way to load the plugins so that they do not affect global execution
		//			environment
		page: suite,
		debug: {
			disableBreakOnExceptions: function(f) {
				return jsh.debug.disableBreakOnExceptionsFor(f);
			}
		},
		file: {
			newTemporaryDirectory: function() {
				return jsh.shell.TMPDIR.createTemporary({ directory: true });
			}
		},
		java: {
			loader: jsh.$jsapi.java,
			io: {
				newTemporaryDirectory: function() {
					var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
					var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
					var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
					dir.mkdirs();
					return dir;
				}
			}
		}
	};

//	this.$module = new function() {
//		this.getResourcePathname = function(path) {
//			return suite.getResourcePathname(path);
//		}
//	};

	this.$platform = jsh.$jsapi.$platform;
	this.$api = jsh.$jsapi.$api;
};

var PartDescriptor = function(p) {
	var suite = new Suite(p.pathname);
	var scope = new Scope(suite,(p.environment) ? p.environment : {});
	return suite.getSuiteDescriptor(scope);	
}

$exports.PartDescriptor = function(p) {
	if (p.reload) {
		return {
		name: p.name,
			execute: function() {
				var suite = new jsh.unit.Suite(new PartDescriptor(p));
				var fire = (function(e) {
					this.fire(e.type,e.detail);
				}).bind(this);
				suite.listeners.add("scenario",fire);
				suite.listeners.add("test",fire);
				suite.run();
			}			
		}
	} else {
		return new PartDescriptor(p);
	}
};

$exports.Scenario = $api.deprecate(function(p) {
	return new $exports.PartDescriptor(jsh.js.Object.set({}, { reload: true }, p));
});

//$exports.Scenario = $api.deprecate($exports.PartDescriptor);

(function() {
	//	TODO	$context.jsdom appears to be unprovided so is presumably unused
	var ns = "http://www.w3.org/1999/xhtml";

	var ApiHtml = function(p) {
		//	TODO	disentangle all this recursion and 'this'-manipulation
		var root = new jsh.document.Document({
			stream: p.file.read(jsh.io.Streams.binary)
		}).document.getElement();

		this.getApi = function(path) {
			var pathname = p.file.getRelativePath(path);
			return new ApiHtml({
				file: getApiHtml(pathname)
			});
		}

		var getElement = function(e,declaration) {
			var reference = e.element.attributes.get({
				namespace: "http://www.inonit.com/jsapi",
				name: "reference"
			});
			if (reference) {
				try {
					var getApi = function(path) {
						return declaration.getApi(path);
					};
					return eval(reference);
				} catch (e) {
					var _e = e;
					debugger;
					var error = new EvalError("Error evaluating reference: " + reference + " in " + p.file);
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
				rv = rv.search({
					filter: function(e) {
						return e.element && e.element.attributes.get({
							namespace: "http://www.inonit.com/jsapi",
							name: "id"
						}) == tokens[i]
					},
					descendants: function(e) {
						//	TODO	obviously a function like this should return true if it is a document as well, but it will only
						//			be called for children, and a document should never be a child
						return e.element && e.element.attributes.get({
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
	};

	var getHtml = function(item) {
		var file = item.file;
		//	TODO	it would be nice to get the below from the document itself like we did with E4X
		var document = new jsh.document.Document({ stream: file.read(jsh.io.Streams.binary) });
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

		var jsdom = new function() {
			this.filter = function(p) {
				if (p.name) return jsh.js.document.filter({ elements: p.name });
				if (p.id) {
					return function(node) {
						return node.element && node.element.attributes.get("id") == p.id;
					};
				}
				throw new Error("No match for jsdom.filter");
			}
		}

		var root = document.children.filter(jsdom.filter({ name: "html" }))[0];

		var head = root.children.filter(jsdom.filter({ name: "head" }))[0];
		var css = head.children.filter(function(node) {
			return node.name && node.name.local == "link" && /api\.css$/.test(node.getAttribute("href"));
		})[0];
		if (css) {
			head.remove(css);
		}
		head.children.push(new jsh.js.document.Element({
			type: {
				namespace: ns,
				name: "link"
			},
			attributes: [
				{ name: "rel", value: "stylesheet" },
				{ name: "type", value: "text/css" },
				{ name: "href", value: top + "api.css" }
			]
		}));
		var js = head.children.filter(function(node) {
			return node.name && node.name.local == "script" && /api\.js$/.test(node.getAttribute("src"));
		})[0];
		if (js) {
			head.remove(js);
		}
		head.children.push(new jsh.js.document.Element({
			type: {
				namespace: ns,
				name: "script"
			},
			attributes: [
				{ name: "type", value: "text/javascript" },
				{ name: "src", value: top + "api.js" }
			]
		}));

		var body = root.children.filter(jsdom.filter({ name: "body" }))[0];
		body.children.splice(0,0,new jsh.js.document.Element({
			type: {
				namespace: ns,
				name: "a"
			},
			attributes: [
				{ name: "href", value: top + "index.html" }
			],
			children: [
				new jsh.js.document.Text({ text: "Documentation Home" })
			]
		}));

		var apiSpecificationMarkers = body.search({
			descendants: function(node) {
				return true;
			},
			filter: jsdom.filter({ id: "template.body" })
		});
		if (apiSpecificationMarkers.length == 0) {
			var contextDiv = body.search({
				//	TODO	probably need to be able to return STOP or something from filter to stop searching below a certain element
				//	TODO	may want to look into xpath
				descendants: function(node) {
					return true;
				},
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
		var withJsapiReference = root.search({
			descendants: function(node) {
				return true;
			},
			filter: function(node) {
				return node.element && node.element.attributes.get({
					namespace: "http://www.inonit.com/jsapi",
					name: "reference"
				}) != null;
			}
		});
		for (var i=0; i<withJsapiReference.length; i++) {
			var e = withJsapiReference[i];
			var resolved = declaration.resolve(e);
			if (resolved) {
				e.children.splice(0,e.children.length);
				var nodes = resolved.get();
				nodes.forEach(function(node) {
					e.children.push(node);
				});
			} else {
				throw new Error("Could not resolve reference in: " + e + " from " + getApiHtml(item.location));
			}
		}
		return document;
	};

	//	TODO	this may be close to obsolescence with the new documentation structure using hyperlinks and client-side processing
	var document = function(p) {
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
			var read = function(name) {
				return $context.html.getCode(name);
//				if ($context.api) return $context.api.getFile(name).read(jsh.io.Streams.binary);
				//	TODO	probably $loader.resource() and run jsapi.js as a module rather than file
				throw new Error();
			}
			destination.getRelativePath(name).write(read(name));
		});

		modules.forEach( function(item) {
			jsh.shell.echo("Generating documentation from " + item.location + " ...");
			item.file = getApiHtml(item.location);
			item.path = p.getPath(item.file);
			var document = getHtml(item);
			destination.getRelativePath(item.path).write(document.toString(), { recursive: true });
		});

		var newIndex = new jsh.document.Document({
			stream: p.index.read(jsh.io.Streams.binary)
		});

		var elements = function(node) {
			return Boolean(node.element);
		};

		var edit = function(element) {
			if (element.element.type.name == "a" || element.element.type.name == "link") {
				var href = element.element.attributes.get("href");
				if (p.prefix && href.substring(0,p.prefix.length) == p.prefix) {
					element.element.attributes.set("href", href.substring(p.prefix.length));
				} else if (href.indexOf("://") != -1) {
					//	do nothing
				} else {
					//	copy reference, hopefully this is relative reference without welcome file mapping
					var target = p.index.getRelativePath(href);
					var targetFile = target.file;
					jsh.shell.echo("Copying " + targetFile + " to " + destination.getRelativePath(href) + " ...");
					targetFile.copy(destination.getRelativePath(href), {
						recursive: true,
						filter: function(o) {
							if (o.exists) return false;
							return true;
						}
					});
				}
			}
			var children = element.children.filter(elements);
			children.forEach(function(child) {
				edit(child);
			});
		};

		edit(newIndex.document.getElement());
		destination.getRelativePath("index.html").write(newIndex.toString(), { append: false });
	}

	$exports.doc = function(p) {
		document(jsh.js.Object.set(p, { old: true }));
	};

	$exports.documentation = function(p) {
		document(p);
	};
})();