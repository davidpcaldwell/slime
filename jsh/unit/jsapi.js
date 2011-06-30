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
		var SCRIPT_TYPE_PREFIX = "application/x.jsapi#";
		
		var scripts = [];

		for each (var item in html..script) {
			var type = String(item.@type);
			if (type.substring(0,SCRIPT_TYPE_PREFIX.length) == SCRIPT_TYPE_PREFIX) {
				scripts.push({ type: type.substring(SCRIPT_TYPE_PREFIX.length), element: item });
			}
		}
		
		this.getUnit = function(id) {
			return new Constructor(html..*.(@jsapi::id == id));
		}

		this.scripts = function(type) {
			if (type) {
				var rv = scripts;
				rv = rv.filter(function(s) {
					return s.type == type;
				});
				return rv.map( function(s) {
					return s.element;
				});
			} else {
				return scripts;
			}
		}
		
		var getScenario = function(scope,element) {
			var getScripts = function(type) {
				return element.script.(@type == SCRIPT_TYPE_PREFIX + type);
			}
			
			var p = {};
			if (element == html) {
				p.name = descriptor.path;
			} else if (element.@jsapi::id.length()) {
				p.name = String(element.@jsapi::id);
			} else {
				if (element.div.(@["class"] == "name").length()) {
					p.name = String(element.div.(@["class"] == "name"));
				} else {
					p.name = "<" + element.localName() + ">";
				}
			}
			
			p.initialize = function() {
				var initializes = getScripts("initialize");
				for (var i=0; i<initializes.length(); i++) {
					with(scope) {
						eval(String(initializes[i]));
					}
				}
			};
			
			p.execute = function(unit) {
				var children = element.elements();
				for (var i=0; i<children.length(); i++) {
					if (children[i].localName() == "script" && String(children[i].@type) == (SCRIPT_TYPE_PREFIX + "tests")) {
						with(scope) {
							with(unit) {
								eval(String(children[i]));
							}
						}
					} else if (children[i].localName() == "script") {
						//	do nothing
					} else {
						var areTests = function(script) {
							return Boolean(script.(@type == (SCRIPT_TYPE_PREFIX + "initialize")).length())
								|| Boolean(script.(@type == (SCRIPT_TYPE_PREFIX + "tests")).length())
								|| Boolean(script.(@type == (SCRIPT_TYPE_PREFIX + "destroy")).length())
							;
						}
						
						if (areTests(children[i].script) || areTests(children[i]..script)) {
							unit.scenario(getScenario(scope,children[i]));
						}
					}
				}
			};
			
			p.destroy = function() {
				var destroys = getScripts("destroy");
				for (var i=0; i<destroys.length(); i++) {
					with(scope) {
						eval(String(destroys[i]));
					}
				}
			};
			
			return p;
		}
		
		this.getScenario = function(scope,unit) {
			var element = (unit) ? html..*.(@jsapi::id == unit) : html;
			if (!element) throw new Error("Unit test not found: " + unit);
			return getScenario(scope,element);
		}
	}

	var moduleToItem = function(moduleDescriptor,unit) {
		return new function() {
			var modulepath = moduleDescriptor.location;
			this.name = modulepath.toString();

			if (!moduleDescriptor.location.directory && !moduleDescriptor.location.file) {
				throw new Error("Not found: " + moduleDescriptor.location);
			}
			if (getApiHtml(moduleDescriptor.location)) {
				this.suite = new ApiHtmlTests(moduleDescriptor);
			}

			this.namespace = moduleDescriptor.namespace;

			var loadApiHtml = function(api,html,contextScript) {
				//	Interpret unit tests from document
				if (!parameters.options.notest) {
					(function() {
						var $unit = api.$unit;
						var $jsapi = api.$jsapi;
						var $java = api.$java;
						var $module = api.$module;
						var $platform = jsh.$jsapi.$platform;
						var $api = jsh.$jsapi.$api;

						var scopes = html.scripts("scope");
						for (var i=0; i<scopes.length; i++) {
							eval(String(scopes[i]));
						}

						api.$unit.context = eval(String(contextScript));

						if (api.$unit.context) {
							var target = (unit) ? html.getUnit(unit) : html;
							
							api.$unit.create = function() {
								var module = api.module;

								var initializes = target.scripts("initialize");
								api.$unit.initialize = function() {
									for (var i=0; i<initializes.length; i++) {
										eval(String(initializes[i]));
									}
								}

								var tests = target.scripts("tests");
								api.$unit.execute = function(scope) {
									for (var i=0; i<tests.length; i++) {
										var name = (tests[i].@jsapi::id.length()) ? String(tests[i].@jsapi::id) : null;
										scope.scenario(new function() {
											this.name = (name) ? name : "<script>";
											this.execute = function(scope) {
												try {
													eval(String(tests[i]));
												} catch (e) {
													var error = new EvalError("Error evaluating: " + String(tests[i]) + ": " + e);
													error.error = e;
													throw error;
												}
											}
										});
									}
								}
							}
						} else {
							api.$unit.create = function() {
								api.$unit.initialize = function(scope) {
								}

								api.$unit.execute = function(scope) {
								}
							}
						}
					})();
				}
			}

			this.loadTestsInto = function(scope,contextScript) {
				if (this.suite) {
					loadApiHtml(scope,this.suite,contextScript);
				}
			}
			
			this.getScenario = function(scope) {
				return this.suite.getScenario(scope,unit);
			}

			this.loadWith = function(context) {
				return jsh.loader.module(modulepath, (context) ? context : {});
			}

			this.getResourcePathname = function(path) {
				if (modulepath.directory) return modulepath.directory.getRelativePath(path);
				if (modulepath.file) return modulepath.file.parent.getRelativePath(path);
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
				if (contextScripts.length == 0) {
					contextScripts = [<script>{"{}"}</script>];
				}
				
				var contexts = [];
				for (var i=0; i<contextScripts.length; i++) {
					var id = (contextScripts[i].@jsapi::id.length() > 0) ? String(contextScripts[i].@jsapi::id) : "";
					with(scope) {
						var value = eval("(" + String(contextScripts[i]) + ")");
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
				
				for (var i=0; i<contexts.length; i++) {
					scope.$unit = new function() {
						var contextId = contexts[i].id;
						this.name = suite.item.name + "-" + String(i) + contextId;
					}
					try {
						//suite.item.loadTestsInto(scope,contexts[i]);

//						scope.module = suite.item.loadWith(scope.$unit.context);
						scope.module = suite.item.loadWith(contexts[i]);
						scope.context = contexts[i];

//						scope.$unit.create();
					} catch (e) {
						//	Do not let initialize() throw an exception, which it might if it assumes we successfully loaded the module
						scope.$unit.initialize = function() {
						}
						scope.$unit.execute = function(scope) {
							throw e;
						}
					}
					//topscope.scenario( scope.$unit )
					topscope.scenario( suite.item.getScenario(scope) );
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