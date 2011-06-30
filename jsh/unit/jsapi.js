//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var jsapi = new Namespace("http://www.inonit.com/jsapi");

var getApiHtml = function(moduleMainPathname) {
	if (moduleMainPathname.directory) {
		return moduleMainPathname.directory.getFile("api.html");
	} else if (moduleMainPathname.file) {
		var basename = moduleMainPathname.file.pathname.basename;
		var directory = moduleMainPathname.file.parent;
		var jsName = /(.*)\.js$/.exec(basename);
		if (jsName) {
			return directory.getFile(jsName[1]+".api.html");
		} else {
			return directory.getFile(basename+".api.html");
		}
	}
}

var E4X = function(html) {
	var map = function(query) {
		var rv = [];
		for (var i=0; i<query.length(); i++) {
			rv[i] = new Element(query[i]);
		}
		return rv;		
	}
	
	var Element = function(xml) {
		this.localName = xml.localName();
		
		this.toString = function() {
			return xml.toXMLString();
		}
		
		this.getContentString = function() {
			return String(xml);
		}
		
		this.getScripts = function(type) {
			return map(xml.script.(@type == ($context.html.MEDIA_TYPE + "#" + type)));
		}
		
		this.getDescendantScripts = function(type) {
			if (type) {
				return map(xml..script.(@type == ($context.html.MEDIA_TYPE + "#" + type)));
			} else {
				return map(xml..script);
			}
		}
			
		this.getChildElements = function() {
			return map(xml.elements());
		}
		
		this.getScriptType = function() {
			return String(xml.@type);
		}
		
		this.isTop = function() {
			return xml == html;
		}
		
		this.getJsapiId = function() {
			if (xml.@jsapi::id.length()) return String(xml.@jsapi::id);
			return null;
		}
		
		this.getNameDiv = function() {
			var rv = xml.div.(@["class"] == "name");
			if (rv.length()) return rv.toXMLString();
			return null;
		}
	}
	
	this.top = new Element(html);
	
	this.getScriptDescendants = function(type) {
		return this.top.getDescendantScripts(type);
	}
	
	this.getElementByJsapiId = function(id) {
		return map(html..*.(@jsapi::id == id));
	}
}

$exports.tests = new function() {
	var testGroups = [];

	var ApiHtmlTests = function(descriptor) {
		var Constructor = arguments.callee;
		
		var html = (function() {
			var file = getApiHtml(descriptor.location);
			return file.read(XML);
		})();
		if (html.length() > 1) {
			html = (function(list) {
				for (var i=0; i<list.length(); i++) {
					if (list[i].localName()) {
						return list[i];
					}
				}
			})(html);
		}
		
		var e4x = new E4X(html);
		
		var SCRIPT_TYPE_PREFIX = $context.html.MEDIA_TYPE + "#";
		
		var scripts = [];

		e4x.getScriptDescendants().forEach( function(node) {
			var type = node.getScriptType();
			if (type.substring(0,SCRIPT_TYPE_PREFIX.length) == SCRIPT_TYPE_PREFIX) {
				scripts.push({ type: type.substring(SCRIPT_TYPE_PREFIX.length), element: node });
			}			
		});

		this.scripts = function(type) {
//			//	TODO	currently used only for context; 
			return e4x.top.getDescendantScripts(type);
		}
		
		var getScenario = function(scope,element) {
			var p = {};
			if (element.isTop()) {
				p.name = descriptor.path;
			} else if (element.getJsapiId()) {
				p.name = element.getJsapiId();
			} else {
				if (element.getNameDiv()) {
					p.name = element.getNameDiv();
				} else {
					p.name = "<" + element.localName + ">";
				}
			}
			
			p.initialize = function() {
				var initializes = element.getScripts("initialize");
				for (var i=0; i<initializes.length; i++) {
					with(scope) {
						eval(initializes[i].getContentString());
					}
				}
			};
			
			p.execute = function(unit) {
				var children = element.getChildElements();
				for (var i=0; i<children.length; i++) {
					if (children[i].localName == "script" && children[i].getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")) {
						with(scope) {
							with(unit) {
								eval(children[i].getContentString());
							}
						}
					} else if (children[i].localName == "script") {
						//	do nothing
					} else {
						var areTests = function(script) {
							return script.getScriptType() == (SCRIPT_TYPE_PREFIX + "initialize")
								|| script.getScriptType() == (SCRIPT_TYPE_PREFIX + "tests")
								|| script.getScriptType() == (SCRIPT_TYPE_PREFIX + "destroy")
							;
						}
						
						if (
							children[i].getDescendantScripts().some(function(script) {
								return areTests(script);
							})
						) {
							unit.scenario(getScenario(scope,children[i]));	
						}
					}
				}
			};
			
			p.destroy = function() {
				var destroys = element.getScripts("destroy");
				for (var i=0; i<destroys.length; i++) {
					with(scope) {
						eval(destroys[i].getContentString());
					}
				}
			};
			
			return p;
		}
		
		this.getScenario = function(scope,unit) {
			var element = (unit) ? e4x.getElementByJsapiId(unit) : e4x.top;
			if (!element) throw new Error("Unit test not found: " + unit);
			return getScenario(scope,element);
		}
	}

	var moduleToItem = function(moduleDescriptor,unit) {
		return new function() {
//			var modulepath = moduleDescriptor.location;
			this.name = moduleDescriptor.location.toString();

			if (!moduleDescriptor.location.directory && !moduleDescriptor.location.file) {
				throw new Error("Not found: " + moduleDescriptor.location);
			}
			if (getApiHtml(moduleDescriptor.location)) {
				this.suite = new ApiHtmlTests(moduleDescriptor);
			}

			this.namespace = moduleDescriptor.namespace;

			this.getScenario = function(scope) {
				return this.suite.getScenario(scope,unit);
			}

			this.loadWith = function(context) {
				return jsh.loader.module(moduleDescriptor.location, (context) ? context : {});
			}

			this.getResourcePathname = function(path) {
				if (moduleDescriptor.location.directory) return moduleDescriptor.location.directory.getRelativePath(path);
				if (moduleDescriptor.location.file) return moduleDescriptor.location.file.parent.getRelativePath(path);
				throw "Unimplemented";
			}
		}
	}

	this.add = function(module,unit) {
		testGroups.push(moduleToItem(module,unit));
	}

	this.run = function(successWas) {
		var SCOPE = new function() {
			var $newTemporaryDirectory = function() {
				var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
				var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
				var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
				dir.mkdirs();
				return dir;
			}

			this.$java = {
				io: {
					newTemporaryDirectory: $newTemporaryDirectory
				}
			};

			this.$jsapi = {
				module: function(name,context) {
					if (typeof(name) == "object" && typeof(context) == "string") {
						jsh.shell.echo("DEPRECATED: $jsapi.module(" + arguments[1] +") called with context,name");
						return arguments.callee.call(this,arguments[1],arguments[0]);
					}
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
			};
		};

		var $scenario = {};
		$scenario.name = "Unit tests";
		var suites = [];
		$scenario.execute = function(topscope) {
			jsh.shell.echo("Environments present: " + Object.keys($context.ENVIRONMENT));
			//	var item is expected to be $scope.$unit
			suites.forEach( function(suite) {
				var scope = {
					$java: SCOPE.$java,
					$jsapi: SCOPE.$jsapi,
					$module: new function() {
						this.getResourcePathname = function(path) {
							return suite.item.getResourcePathname(path);
						}
					},
					$platform: jsh.$jsapi.$platform,
					$api: jsh.$jsapi.$api
				};
				
				var contextScripts = suite.item.suite.scripts("context");
				
				var contexts = [];
				for (var i=0; i<contextScripts.length; i++) {
					var id = (contextScripts[i].getJsapiId()) ? contextScripts[i].getJsapiId() : "";
					with(scope) {
						var value = eval("(" + contextScripts[i].getContentString() + ")");
					}
					if (value.length) {
						value.forEach( function(context,index) {
							context.id = id + "[" + index + "]";
						});
						contexts = contexts.concat(value);
					} else {
						value.id = id;
						contexts.push(value);
					}
				}
				
				if (contexts.length == 0) {
					contexts.push({});
				}
				
				for (var i=0; i<contexts.length; i++) {
					try {
						scope.module = suite.item.loadWith(contexts[i]);
						scope.context = contexts[i];
						topscope.scenario( suite.item.getScenario(scope) );
					} catch (e) {
						//	Do not let initialize() throw an exception, which it might if it assumes we successfully loaded the module
						topscope.scenario(new function() {
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
			suites.push({ item: item });
		} );

		var SCENARIO = new $context.Scenario($scenario);
		successWas(SCENARIO.run( $context.console ));
	}
}

$exports.doc = function(modules,to) {
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

	var index = $context.jsapi.getFile("index.html").read(XML);

	//	TODO	parameterize the below rather than hard-coding
	index.head.title = "API Documentation";
	index.body.h1 = "API Documentation";

	delete index.body.table.tbody.tr[0];

	var doc = {};

	modules.forEach( function(item) {
		var xhtml = getApiHtml(item.location).read(XML);
		doc[item.path] = xhtml;
	});

	modules.forEach( function(item) {
		if (item.ns) {
			jsh.shell.echo("Generating documentation for " + item.ns + " from module at " + item.location + " ...");
			var xhtml = getApiHtml(item.location).read(XML);
			xhtml.head.appendChild(<link rel="stylesheet" type="text/css" href="api.css" />);
			xhtml.head.appendChild(<script type="text/javascript" src="api.js">{"/**/"}</script>);

			xhtml.body.insertChildAfter(null,<a href="index.html">Documentation Home</a>);

			var contextDiv = xhtml..div.(h1 == "Context");
			if (contextDiv.length()) {
				contextDiv.parent().replace(contextDiv.childIndex(),<></>);
				//	Why does the below not work?
				//delete contextDiv.parent()[contextDiv.childIndex()];
			}

			//	TODO	document and enhance this ability to import documentation from other files
			for each (var e in xhtml..*.(@jsapi::reference.length() > 0)) {
				var x = e;
				while(x.@jsapi::reference.length() > 0) {
					try {
						x = eval(String(x.@jsapi::reference));
					} catch (e) {
						var error = new EvalError("Error evaluating reference: " + x.@jsapi::reference);
						var string = String(x.@jsapi::reference);
						error.string = string;
						error.toString = function() {
							return this.message + "\n" + this.string;
						}
						throw error;
					}
				}
				e.setChildren(x.children());
			}

			var pagename = "ns." + item.ns + ".html";
			destination.getRelativePath(pagename).write(xhtml.toXMLString());

			index.body.table.tbody.appendChild(<tr><td><a href={pagename}>{item.ns}</a></td><td>{String(xhtml.head.title)}</td></tr>)
		}
	});

	destination.getRelativePath("index.css").write(
		$context.jsapi.getFile("index.css").read(jsh.io.Streams.binary),
		{ append: false }
	);
	destination.getRelativePath("index.html").write(index.toXMLString());
}