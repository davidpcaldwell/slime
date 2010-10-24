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

	var moduleToItem = function(ns,modulepath) {
		return new function() {
			this.name = modulepath.toString();

			this.namespace = ns;

			var loadApiHtml = function(api,html) {
				//	Interpret unit tests from document
				if (!parameters.options.notest) {
					(function() {
						var $unit = api.$unit;
						var $jsapi = api.$jsapi;
						var $java = api.$java;
						var $platform = jsh.$jsapi.$platform;
						var $api = jsh.$jsapi.$api;

						for each (var item in html..script.(@type == "application/x.jsapi#scope")) {
							eval(String(item));
						}

						for each (var item in html..script.(@type == "application/x.jsapi#context")) {
							api.$unit.context = eval(String(item));
						}

						api.$unit.initialize = function(scope) {
							for each (var item in html..script.(@type == "application/x.jsapi#initialize")) {
								eval(String(item));
							}
						}

						api.$unit.execute = function(scope) {
							for each (var item in html..script.(@type == "application/x.jsapi#tests")) {
								var module = api.module;
								scope.scenario(new function() {
									this.name = (item.@jsapi::id.length()) ? String(item.@jsapi::id) : "<script>";
									var code = String(item);
									this.execute = function(scope) {
										eval(code);
									}
								});
							}
						}
					})();
				}
			}

			this.loadTestsInto = function(scope) {
				if (!modulepath.directory && !modulepath.file) throw "Not found: " + modulepath;
				var api = getApiHtml(modulepath);
				if (api) {
					var xml = api.read(XML);
					loadApiHtml(scope,xml);
				}
			}

			this.loadWith = function(context) {
				return jsh.loader.module(modulepath, (context) ? context : {});
			}
		}
	}

	this.add = function(ns,modulepathname) {
		testGroups.push(moduleToItem(ns,modulepathname));
	}

	this.run = function(successWas) {
		var SCOPE = new function() {
			var $newTemporaryDirectory = function() {
				var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
				var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
				var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
				return dir;
			}

			this.$java = {
				io: {
					newTemporaryDirectory: $newTemporaryDirectory
				}
			};

			this.$jsapi = {
				module: function(context,name) {
					var MODULES = $context.MODULES;
					if (MODULES[name+"/"]) name += "/";
					if (!MODULES[name]) throw "Module referenced but not found: '" + name + "'";
					return jsh.loader.module(MODULES[name],context);
				},
				//	TODO	Probably the name of this call should reflect the fact that we are returning a native object
				environment: $context.ENVIRONMENT,
				newTemporaryDirectory: function() {
					var $path = $newTemporaryDirectory();
					$path.mkdirs();
					var pathstring = String($path.getCanonicalPath());
					var os = jsh.file.filesystems.os.Pathname(pathstring);
					return (jsh.file.filesystems.cygwin) ? jsh.file.filesystems.cygwin.toUnix(os).directory : os.directory;
				}
			};
		};

		var $scenario = new $context.Scenario();
		$scenario.name = "Unit tests";
		$scenario.files = [];
		$scenario.execute = function(scope) {
			this.files.forEach( function(item) {
				scope.scenario( item )
			} );
		}

		testGroups.forEach( function(item) {
			jsh.shell.echo("Processing: " + item.code + " " + item.test + " " + item.namespace);
			var scope = {
				$java: SCOPE.$java,
				$jsapi: SCOPE.$jsapi
			};

			scope.$unit = new function() {
				this.name = item.name;
			}
			$scenario.files.push( scope.$unit );

			//	This property will be set by jsapi.jsh if we load api.html: to the file object representing api.html
			try {
				item.loadTestsInto(scope);

				scope.module = item.loadWith(scope.$unit.context);
			} catch (e) {
				//	Do not let initialize() throw an exception, which it might if it assumes we successfully loaded the module
				scope.$unit.initialize = function() {
				}
				scope.$unit.execute = function(scope) {
					throw e;
				}
			}
		} );

		successWas($scenario.run( $context.console ));
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
		destination.getRelativePath(name).write($context.api.getFile(name).read(jsh.file.Streams.binary));
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
				debugger;
				var x = e;
				while(x.@jsapi::reference.length() > 0) {
					x = eval(String(x.@jsapi::reference));
				}
				e.setChildren(x.children());
			}

			var pagename = "ns." + item.ns + ".html";
			destination.getRelativePath(pagename).write(xhtml.toXMLString());

			index.body.table.tbody.appendChild(<tr><td><a href={pagename}>{item.ns}</a></td><td>{String(xhtml.head.title)}</td></tr>)
		}
	});

	destination.getRelativePath("index.css").write(
		$context.jsapi.getFile("index.css").read(jsh.file.Streams.binary),
		{ append: false }
	);
	destination.getRelativePath("index.html").write(index.toXMLString());
}