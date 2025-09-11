//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.servlet.internal.$host } $host
	 */
	function(Packages,JavaAdapter,$host) {
		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject } */
		var isJava = function($host) {
			return $host["register"];
		};

		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.jrunscript.native.inonit.script.servlet.Rhino.Host } */
		var isRhino = function($host) {
			return isJava($host) && $host["getEngine"];
		};

		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.servlet.internal.$host.jsh } */
		var isScript = function($host) {
			return $host["loaders"];
		}

		/** @type { slime.jrunscript.runtime.Exports } */
		var $java = (function() {
			//	TODO	there is no test coverage for the below; when the rhino/ directory was renamed to jrunscript/, the test suite still passed
			//	Packages.java.lang.System.err.println("$host.getLoader = " + $host.getLoader + " $host.getEngine = " + $host.getEngine + " $host.getClasspath = " + $host.getClasspath);
			if (isRhino($host)) {
				debugger;
				//	TODO	consider pushing these details back into inonit.script.servlet.Rhino.Host
				//			would need to construct the two-property scope object below; rest should be straightforward.
				//			Need also to identify test case
				return $host.getEngine().script(
					"jrunscript/rhino.js",
					String($host.getLoader().getLoaderCode("jrunscript/rhino.js")),
					{
						$loader: $host.getLoader(),
						$rhino: $host.getEngine()
					},
					null
				);
			} else if (isJava($host)) {
				//	TODO	implement along with Graal servlets
				var $graal;
				var scripts = eval(String($host.getLoader().getLoaderCode("jrunscript/nashorn.js")));

				var rv = scripts.script(
					"jrunscript/nashorn.js",
					$host.getLoader().getLoaderCode("jrunscript/nashorn.js"),
					{
						$graal: $graal,
						$loader: $host.getLoader()
					},
					null
				);
				return rv;
			} else if (isScript($host)) {
				return void(0);
			} else {
				throw new Error("Unreachable.");
			}
		})();

		var $servlet = (function() {
			if (isJava($host)) {
				var rv = {};
				//	TODO	Find a way to use _url version of loader/jrunscript/expression.js constructor to get access to this object, probably
				//			via the created loader's .source property
				rv.resources = Packages.inonit.script.engine.Code.Loader.create($host.getServlet().getServletConfig().getServletContext().getResource("/"));
				rv.path = $host.getServlet().getServletConfig().getInitParameter("script");
				rv.parameters = (function() {
					/** @type { { [x: string]: string }} */
					var rv = {};
					var _enumeration = $host.getServlet().getServletConfig().getInitParameterNames();
					while(_enumeration.hasMoreElements()) {
						var _key = _enumeration.nextElement();
						var key = String(_key);
						rv[key] = String($host.getServlet().getServletConfig().getInitParameter(_key));
					}
					return rv;
				})();
				rv.getMimeType = function(path) {
					return $host.getServlet().getServletConfig().getServletContext().getMimeType(path);
				};
				/**
				 *
				 * @param { string } prefix
				 * @returns { string[] }
				 */
				rv.getResourcePaths = function(prefix) {
					var _set = $host.getServlet().getServletContext().getResourcePaths("/" + prefix);
					var rv = [];
					var _i = _set.iterator();
					while(_i.hasNext()) {
						rv.push(String(_i.next().substring(prefix.length+1)));
					}
					return rv;
				}
				return rv;
			}
		})();

		var toExportScope = (function() {
			if ($java) return $java.old.loader.tools.toExportScope;
			if (isScript($host)) {
				return $host.Loader.tools.toExportScope;
			}
		})();

		/** @type { slime.servlet.Scope } */
		var scope = toExportScope({
			httpd: void(0),
			$loader: void(0),
			$parameters: void(0)
		});

		var bootstrap = (
			/**
			 *
			 * @returns { slime.servlet.internal.api }
			 */
			function() {
				if ($java && $servlet) {
					var loader = new $java.Loader({
						_source: $servlet.resources
					});
					var code = {
						/** @type { slime.jrunscript.java.Script } */
						java: loader.script("WEB-INF/slime/jrunscript/host/"),
						/** @type { slime.jrunscript.io.Script } */
						io: loader.script("WEB-INF/slime/jrunscript/io/"),
						/** @type { slime.web.Script } */
						web: loader.script("WEB-INF/slime/js/web/")
					};
					var rv = {};
					rv.$api = $java.$api;
					rv.js = loader.module("WEB-INF/slime/js/object/", {
						globals: true
					});
					rv.java = code.java({
						$slime: $java,
						logging: {
							prefix: "slime.servlet"
						}
					});
					rv.io = code.io({
						$slime: $java,
						api: {
							java: rv.java
						},
						nojavamail: false
					});
					rv.web = code.web(loader.file("WEB-INF/slime/js/web/context.java.js"));
					rv.loader = {
						paths: function(prefix) {
							return $servlet.getResourcePaths(prefix);
						}
					}

					rv.js.web = rv.web;
					$java.$api.deprecate(rv.js, "web");

					return rv;
				}
			}
		)();

		/**
		 * @type { (p: any, prefix?: any) => slime.old.Loader }
		 */
		var Loader = (function() {
			if (bootstrap) {
				var Loader = function(p,prefix) {
					/** @type { slime.old.loader.Source } */
					var source = {
						get: function(path) {
							var pp = {};
							pp._source = (prefix) ? p._source.child(prefix) : p._source;
							pp.type = function(path) {
								var _type = $servlet.getMimeType(path);
								if (/\.css$/.test(path)) {
									_type = new Packages.java.lang.String("text/css");
								}
								if (_type) return bootstrap.io.mime.Type.parse(String(_type));
								return null;
							};

							var delegate = new bootstrap.io.Loader(pp);
							var delegated = delegate.source.get(path);
							if (!delegated) return null;
							return bootstrap.$api.Object.compose(delegated, {
								type: pp.type(path)
							});
						},
						list: function(path) {
							var full = prefix + path;
							return bootstrap.loader.paths(full).map(function(string) {
								if (string.substring(string.length-1) == "/") {
									return {
										path: string.substring(0,string.length-1),
										loader: true,
										resource: false
									}
								} else {
									return {
										path: string,
										loader: false,
										resource: true
									}
								}
							});
						}
					}
					// var rv = new bootstrap.io.Loader(pp);
					var rv = new bootstrap.io.Loader(source);
					//	TODO	Below failed TypeScript and didn't seem to make sense; remove when safe
					// rv.list = function(m) {
					// 	var path = prefix + m.path;
					// 	var rv = bootstrap.loader.paths(path);
					// 	return rv;
					// }
					return rv;
				}

				return function(p,prefix) {
					return Loader(p,prefix);
				};
			}
		})();

		/** @type { slime.servlet.internal.api } */
		var api = (function() {
			if (bootstrap) {
				return bootstrap;
			} else if (isScript($host)) {
				return $host.api;
			}
		})();

		var loaders = (
			/**
			 * @return { slime.servlet.internal.Loaders }
			 */
			function() {
				if ($java && $servlet) {
					//	servlet container, determine webapp path and load relative to that
					var path = String($servlet.path);
					var tokens = path.split("/");
					var prefix = tokens.slice(0,tokens.length-1).join("/") + "/";
					Packages.java.lang.System.err.println("Creating application loader with prefix " + prefix);
					var loader = Loader({
						_source: $servlet.resources
					});
					return {
						script: Loader({
							_source: $servlet.resources
						},prefix),
						container: Loader({
							_source: $servlet.resources
						},""),
						api: loader.Child("WEB-INF/slime/rhino/http/servlet/server/")
					};
				} else if (isScript($host)) {
					return $host.loaders;
				} else {
					throw new Error("Cannot instantiate loaders: $java = " + $java + " $servlet = " + $servlet + " $host = " + $host);
				}
			}
		)();

		/**
		 * @type { { [x: string]: any } }
		 */
		var $parameters = (function() {
			if ($servlet) {
				return $servlet.parameters;
			} else if (isScript($host)) {
				return $host.parameters;
			}
		})();

		/**
		 * Loads the servlet script into the scope; used both on initial load and if a reload is requested.
		 */
		var loadServletScriptIntoScope = (
			/**
			 *
			 * @returns { (scope: slime.servlet.Scope) => void }
			 */
			function() {
				if ($servlet) {
					var path = String($servlet.path);
					var tokens = path.split("/");
					var basename = tokens[tokens.length-1];
					/** @type { (scope: slime.servlet.Scope) => void } */
					var rv = function(scope) {
						Packages.java.lang.System.err.println("Loading servlet from " + path);
						loaders.script.run(basename,scope);
					};
					return rv;
				} else if (isScript($host)) {
					return $host.loadServletScriptIntoScope;
				} else {
					throw new Error();
				}
			}
		)();

		var $slime = (function() {
			if ($java && $servlet) return $java;
			if (isScript($host)) return $host.$slime;
		})();

		var context = (
			/**
			 * @returns { slime.servlet.httpd["context"] }
			 */
			function() {
				if (isScript($host)) return $host.context;
				return {
					stdio: {
						output: function(line) {
							Packages.java.lang.System.out.println(line);
						},
						error: function(line) {
							Packages.java.lang.System.err.println(line);
						}
					}
				}
			}
		)();

		scope.httpd = {
			context: context,
			loader: (loaders.container) ? loaders.container : void(0),
			js: api.js,
			java: api.java,
			io: api.io,
			web: api.web,
			Request: void(0),
			http: void(0),
			Handler: void(0),
			$slime: $slime,
			$java: $slime
		};

		(
			function loadServerApi() {
				//	Populates the Request, http and Handler properties of httpd
				var api = (
					function() {
						/** @type { slime.servlet.internal.server.api.Script } */
						var script = loaders.api.script("module.js");
						return script({
							library: {
								web: scope.httpd.web
							}
						});
					}
				)();
				Object.assign(scope.httpd, api);
			}
		)();

		if (loaders.script) {
			//	TODO	this should be a module loader, basically, for the code itself, so should somehow resolve relative paths in
			// 			the global loader; in the jsh embedding, it should resolve them relative to the current directory of the
			// 			script
			scope.$loader = loaders.script;
		}

		scope.$parameters = $parameters;

		loadServletScriptIntoScope(scope);

		var servlet = (
			function() {
				/**
				 * @type { slime.servlet.internal.server.Exports }
				 */
				var server = (function() {
					if (isScript($host)) {
						return $host.server;
					} else if ($servlet) {
						/** @type { slime.servlet.internal.server.Script } */
						var script = loaders.container.script("WEB-INF/server.js");
						return script({
							api: api
						});
					}
				})();

				return server.Servlet(scope.$exports);
			}
		)();

		scope.httpd.$reload = (isScript($host)) ? function() {
			servlet.destroy();
			loadServletScriptIntoScope(scope);
			servlet.reload(scope.$exports);
		} : null;

		//	TODO	trying to push this first form back into a register() method in the jsh plugin, but for some reason it does not work;
		//			figure out why and do it
		if (isScript($host)) {
			$host.script(servlet);
		} else {
			$host.register(new JavaAdapter(
				Packages.inonit.script.servlet.Servlet.Script,
				servlet
			));
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,$host)
