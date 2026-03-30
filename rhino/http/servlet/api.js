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
	 * @param { slime.servlet.internal.$host } $host An object of type `slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject`
	 * provided by the SLIME servlet environment upon initialization, or an object of type `slime.servlet.internal.$host.jsh`
	 * provided directly by the `jsh` servlet plugin in the case of `jsh`.
	 */
	function(Packages,JavaAdapter,$host) {
		/** @type { slime.servlet.internal.Context } */
		var $context = (function($host) {
			/**
			 * Whether the `$host` argument is a Java host object (as opposed to a script-provided one); used to determine whether
			 * we're running in a Java servlet container or a script-provided environment such as `jsh`.
			 *
			 * @type { ($host: slime.servlet.internal.$host) => $host is slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject }
			 */
			var isJava = function($host) {
				return $host["register"];
			};

			/**
			 * Whether the `$host` object is specifically a Rhino host object. We need to know this so that we can execute the Rhino
			 * versions of jrunscript bootstrap scripts.
			 *
			 * @type { ($host: slime.servlet.internal.$host) => $host is slime.jrunscript.native.inonit.script.servlet.Rhino.Host }
			 */
			var isRhino = function($host) {
				return isJava($host) && $host["getEngine"];
			};

			/** @type { ($host: slime.servlet.internal.$host) => $host is slime.servlet.internal.$host.jsh } */
			var isScript = function($host) {
				return $host["loaders"];
			}

			/**
			 * @type { <T>(p: slime.servlet.internal.ByEnvironment<T>) => ($host: slime.servlet.internal.$host) => T }
			 */
			var byEnvironment = function(variants) {
				return function($host) {
					if (isRhino($host) && variants.rhino) {
						return variants.rhino($host);
					} else if (isJava($host)) {
						return variants.servlet($host);
					} else if (isScript($host)) {
						return variants.script($host);
					} else {
						throw new Error("Unrecognized environment: $host = " + $host);
					}
				};
			};

			var servletConfig = {
				getResourcePaths: function(/** @type { slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject } */$host, /** @type { string } */prefix) {
					var _set = $host.getServletContext().getResourcePaths("/" + prefix);
					var rv = [];
					var _i = _set.iterator();
					while(_i.hasNext()) {
						rv.push(String(_i.next().substring(prefix.length+1)));
					}
					return rv;
				},
				getResources: function(/** @type { slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject } */$host) {
					return Packages.inonit.script.engine.Code.Loader.create($host.getServletContext().getResource("/"));
				},
				getPath: function(/** @type { slime.jrunscript.native.inonit.script.servlet.Servlet.HostObject } */$host) {
					return String($host.getServletConfig().getInitParameter("script"));
				}
			}

			/** @type { ($host: slime.servlet.internal.$host) => slime.jrunscript.runtime.Exports} */
			var runtime = byEnvironment({
				rhino: function($host) {
					//	TODO	there is no test coverage for the below; when the rhino/ directory was renamed to jrunscript/, the test suite still passed
					//	Packages.java.lang.System.err.println("$host.getLoader = " + $host.getLoader + " $host.getEngine = " + $host.getEngine + " $host.getClasspath = " + $host.getClasspath);
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
					)
				},
				servlet: function($host) {
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
				},
				script: function($host) {
					return $host.$slime;
				}
			});

			var $slime = runtime($host);

			var getParameters = byEnvironment({
				servlet: function($host) {
					return (function() {
						/** @type { { [x: string]: string }} */
						var rv = {};
						var _enumeration = $host.getServletConfig().getInitParameterNames();
						while(_enumeration.hasMoreElements()) {
							var key = String(_enumeration.nextElement());
							rv[key] = String($host.getServletConfig().getInitParameter(key));
						}
						return rv;
					})();
				},
				script: function($host) {
					return $host.parameters;
				}
			});

			var getBootstrap = byEnvironment({
				servlet: function($host) {
					var bootstrap = (
						/**
						 *
						 * @returns { slime.servlet.internal.api }
						 */
						function() {
							var loader = new $slime.Loader({
								_source: servletConfig.getResources($host)
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
							rv.$api = $slime.$api;
							rv.js = loader.module("WEB-INF/slime/js/object/", {
								globals: true
							});
							rv.java = code.java({
								$slime: $slime,
								logging: {
									prefix: "slime.servlet"
								}
							});
							rv.io = code.io({
								$slime: $slime,
								api: {
									java: rv.java
								},
								nojavamail: false
							});
							rv.web = code.web(loader.file("WEB-INF/slime/js/web/context.java.js"));
							rv.loader = {
								paths: function(prefix) {
									return servletConfig.getResourcePaths($host, prefix);
								}
							}

							rv.js.web = rv.web;
							$slime.$api.deprecate(rv.js, "web");

							return rv;
						}
					)();
					return bootstrap;
				},
				script: function($host) {
					return $host.api;
				}
			});

			var api = getBootstrap($host);

			var getLoaders = byEnvironment({
				servlet: function($host) {
					/**
					 * @type { (p: { _source: slime.jrunscript.native.inonit.script.engine.Code.Loader }) => slime.loader.old.Loader }
					 */
					var Loader = function(p) {
						var getMimeType = $slime.$api.fp.pipe(
							function(/** @type { string } */path) {
								return $host.getServletContext().getMimeType(path);
							},
							$slime.$api.jrunscript.java.adapt.String
						);

						/** @type { slime.loader.old.Source } */
						var source = {
							get: function(path) {
								var pp = {
									_source: p._source,
									type: function(path) {
										var type = getMimeType(path);
										if (/\.css$/.test(path)) {
											type = "text/css";
										}
										if (type) return api.io.mime.Type.codec.declaration.decode(type);
										return null;
									}
								};

								var delegate = new api.io.Loader(pp);
								var delegated = delegate.source.get(path);
								if (!delegated) return null;
								return api.$api.Object.compose(delegated, {
									type: pp.type(path)
								});
							},
							list: function(path) {
								var full = path;
								return api.loader.paths(full).map(function(string) {
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

						var rv = new api.io.Loader(source);

						return rv;
					};

					//	servlet container, determine webapp path and load relative to that
					var loader = Loader({
						_source: servletConfig.getResources($host)
					});

					return {
						//	TODO	possibly equivalent to loader.Child( <expression used as second argument> )
						script: loader.Child(
							(function() {
								var path = servletConfig.getPath($host);
								var tokens = path.split("/");
								var prefix = tokens.slice(0,tokens.length-1).join("/") + "/";
								return prefix;
							})()
						),
						container: loader,
						api: loader.Child("WEB-INF/slime/rhino/http/servlet/server/")
					};
				},
				script: function($host) {
					return $host.loaders;
				}
			});

			var loaders = getLoaders($host);

			var getContext = byEnvironment({
				servlet: function($host) {
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
				},
				script: function($host) {
					return $host.context;
				}
			});

			var getServletScriptLoader = byEnvironment({
				servlet: function($host) {
					var path = servletConfig.getPath($host);
					var tokens = path.split("/");
					var basename = tokens[tokens.length-1];
					/** @type { (scope: slime.servlet.Scope) => void } */
					var rv = function(scope) {
						Packages.java.lang.System.err.println("Loading servlet from " + path);
						loaders.script.run(basename,scope);
					};
					return rv;
				},
				script: function($host) {
					return $host.loadServletScriptIntoScope;
				}
			});

			var getServer = byEnvironment({
				servlet: function($host) {
					/** @type { slime.servlet.internal.server.Script } */
					var script = loaders.container.script("WEB-INF/server.js");
					return script({
						api: api
					});
				},
				script: function($host) {
					return $host.server;
				}
			});

			/**
			 * Loads the servlet script into the scope; used both on initial load and if a reload is requested.
			 */
			var loadServletScriptIntoScope = getServletScriptLoader($host);

			var getReload = byEnvironment({
				servlet: function($host) {
					return void(0);
				},
				script: function($host) {
					return function() {
						servlet.destroy();
						loadServletScriptIntoScope(scope);
						servlet.reload(scope.$exports);
					}
				}
			});

			return {
				api: api,
				loaders: loaders,
				parameters: getParameters($host),
				context: getContext($host),
				loadServletScriptIntoScope: loadServletScriptIntoScope,
				$slime: $slime,
				/**
				 * @param { slime.servlet.Script } $exports
				 */
				Servlet: function($exports) {
					return getServer($host).Servlet($exports);
				},
				reload: getReload($host),
				register: function(servlet) {
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
			}
		})($host);

		/** @type { slime.servlet.Scope } */
		var scope = $context.$slime.old.loader.tools.toExportScope({
			httpd: (
				function() {
					var rv = {
						context: $context.context,
						loader: ($context.loaders.container) ? $context.loaders.container : void(0),
						js: $context.api.js,
						java: $context.api.java,
						io: $context.api.io,
						web: $context.api.web,
						Request: void(0),
						http: void(0),
						Handler: void(0),
						$slime: $context.$slime,
						$java: $context.$slime,
						$reload: $context.reload
					};

					(
						function loadServerApi() {
							//	Populates the Request, http and Handler properties of httpd
							var api = (
								function() {
									/** @type { slime.servlet.internal.server.api.Script } */
									var script = $context.loaders.api.script("module.js");
									return script({
										library: {
											web: rv.web
										}
									});
								}
							)();
							Object.assign(rv, api);
						}
					)();

					return rv;
				}
			)(),
			$loader: (
				function() {
					if ($context.loaders.script) {
						//	TODO	this should be a module loader, basically, for the code itself, so should somehow resolve relative paths in
						// 			the global loader; in the jsh embedding, it should resolve them relative to the current directory of the
						// 			script
						return $context.loaders.script;
					}
				}
			)(),
			$parameters: $context.parameters
		});

		$context.loadServletScriptIntoScope(scope);

		var servlet = $context.Servlet(scope.$exports);

		$context.register(servlet);
	}
//@ts-ignore
)(Packages,JavaAdapter,$host)
