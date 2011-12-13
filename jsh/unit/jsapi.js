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
	//	TODO	logic for this is largely duplicated in loader/api/api.html.js getApiHtmlPath method, which is string based while
	//			this is pathname- and directory- and file- based
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
	default xml namespace = html.namespace();
	
	var map = function(query) {
		var rv = [];
		for (var i=0; i<query.length(); i++) {
			rv[i] = new Element(query[i]);
		}
		return rv;		
	}
	
	var Element = function(xml) {
		this.localName = xml.localName();
		
		if (xml != html) {
			this.parent = new Element(xml.parent());
		}
		
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
			if (rv.length()) return String(rv);
			return null;
		}
	}
	
	this.top = new Element(html);
}

$exports.tests = new function() {
	var testGroups = [];

	var moduleToItem = function(moduleDescriptor,unit) {
		return new function() {
			this.name = moduleDescriptor.location.toString();

			if (!moduleDescriptor.location.directory && !moduleDescriptor.location.file) {
				throw new Error("Not found: " + moduleDescriptor.location);
			}
			if (getApiHtml(moduleDescriptor.location)) {
				var html = (function() {
					var file = getApiHtml(moduleDescriptor.location);
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

				var name = moduleDescriptor.path;
				if (unit) {
					name += "." + unit;
				}
				this.html = new $context.html.ApiHtmlTests(e4x,name);
				this.getScenario = function(scope) {
					return this.html.getScenario(scope,unit);
				}
			}

			this.namespace = moduleDescriptor.namespace;

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
							topscope.scenario( suite.getScenario(scope) );							
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
			var ns = (function() {
				if (xhtml.length() > 1) {
					return (function() {
						for (var i=0; i<xhtml.length(); i++) {
							if (xhtml[i].nodeKind() == "element") return xhtml[i].namespace();
						}
					})();
				} else {
					return xhtml.namespace();
				}
			})();
			xhtml.ns::head.appendChild(<link rel="stylesheet" type="text/css" href="api.css" />);
			xhtml.ns::head.appendChild(<script type="text/javascript" src="api.js">{"/**/"}</script>);

			xhtml.ns::body.insertChildAfter(null,<a href="index.html">Documentation Home</a>);

			var contextDiv = xhtml..ns::div.(ns::h1 == "Context");
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

			index.body.table.tbody.appendChild(<tr><td><a href={pagename}>{item.ns}</a></td><td>{String(xhtml.ns::head.ns::title)}</td></tr>)
		}
	});

	destination.getRelativePath("index.css").write(
		$context.jsapi.getFile("index.css").read(jsh.io.Streams.binary),
		{ append: false }
	);
	destination.getRelativePath("index.html").write(index.toXMLString());
}