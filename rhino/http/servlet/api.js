//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { slime.servlet.internal.$host } $host
	 */
	function(Packages,JavaAdapter,$host) {
		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.servlet.internal.$host.Java } */
		var isJava = function($host) {
			return $host["register"];
		};

		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.servlet.internal.$host.Rhino } */
		var isRhino = function($host) {
			return isJava($host) && $host["getEngine"];
		};

		/** @type { ($host: slime.servlet.internal.$host) => $host is slime.servlet.internal.$host.jsh } */
		var isScript = function($host) {
			return $host["loaders"];
		}

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
					$host.getLoader().getLoaderCode("jrunscript/rhino.js"),
					{
						$loader: $host.getLoader(),
						$rhino: $host.getEngine()
					},
					null
				);
			} else if (isJava($host)) {
				//	TODO	implement along with Graal servlets
				var $graal;
				var scripts = eval($host.getLoader().getLoaderCode("jrunscript/nashorn.js"));

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
					var rv = {};
					var _enumeration = $host.getServlet().getServletConfig().getInitParameterNames();
					while(_enumeration.hasMoreElements()) {
						var _key = _enumeration.nextElement();
						rv[_key] = $host.getServlet().getServletConfig().getInitParameter(_key);
					}
					return rv;
				})();
				rv.getMimeType = function(path) {
					return $host.getServlet().getServletConfig().getServletContext().getMimeType(path);
				};
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
			if ($java) return $java.Loader.tools.toExportScope;
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

		var bootstrap = (function() {
			if ($java && $servlet) {
				var loader = new $java.Loader({
					_source: $servlet.resources
				});
				var rv = {};
				rv.js = loader.module("WEB-INF/slime/js/object/", {
					globals: true
				});
				rv.java = loader.module("WEB-INF/slime/jrunscript/host/", {
					globals: true,
					$slime: $java
				});
				rv.java.log = loader.file("WEB-INF/slime/js/debug/logging.java.js", {
					prefix: "slime",
					api: {
						java: rv.java
					}
				}).log;
				rv.io = loader.module("WEB-INF/slime/jrunscript/io/", {
					$slime: $java,
					api: {
						js: rv.js,
						mime: $java.mime,
						java: rv.java
					}
				});
				var web = loader.module("WEB-INF/slime/js/web/", loader.file("WEB-INF/slime/js/web/context.java.js"));
				rv.js.web = web;
				// TODO: Deprecate rv.js.web, after figuring out how to access $api; is it loader.$api? Available only in servlet
				// implementation
				rv.web = web;
				rv.loader = {
					paths: function(prefix) {
						return $servlet.getResourcePaths(prefix);
					}
				}
				return rv;
			}
		})();

		/**
		 * @type { (p: any, prefix?: any) => slime.Loader }
		 */
		var Loader = (function() {
			if (bootstrap) {
				var Loader = function(p,prefix) {
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
					// pp.Loader = function(sub) {
					// 	return new Loader(p,prefix+sub);
					// }
					var source = {
						get: function(path) {
							var delegate = new bootstrap.io.Loader(pp);
							var delegated = delegate.source.get(path);
							if (!delegated) return null;
							return bootstrap.js.Object.set({}, delegated, {
								type: pp.type(path)
							});
							// dResource = new bootstrap.io.Resource(dResource);
							// // TODO: this is now a mess; the below TODO comment is probably obsolete, and it's quite possible this could be
							// // vastly simplified
							// if (dResource && !dResource.type) {
							// 	//	TODO	all of this is necessary because we cannot alter the type of a resource, because it is cached.
							// 	//			as such, this is tightly coupled with the rhino io.js source code
							// 	var newtype = pp.type(path);
							// 	var delegate = {};
							// 	delegate.read = {};
							// 	delegate.read.binary = dResource.read.binary;
							// 	delegate.type = newtype;
							// 	delegate.name = dResource.name;
							// 	if (dResource.hasOwnProperty("length")) {
							// 		Object.defineProperty(delegate,"length",{
							// 			get: function() {
							// 				return dResource.length;
							// 			}
							// 		});
							// 	}
							// 	if (dResource.hasOwnProperty("modified")) {
							// 		Object.defineProperty(delegate,"modified",{
							// 			get: function() {
							// 				return dResource.modified;
							// 			}
							// 		});
							// 	}
							// 	return new bootstrap.io.Resource(delegate)
							// 	if (newtype) {
							// 		var rv = {};
							// 	}
							// 	Packages.java.lang.System.err.println("newtype = " + path + " " + newtype);
							// 	dResource.type = newtype;
							// 	Packages.java.lang.System.err.println("dResource = " + path + " pp.type=" + dResource.type);
							// }
							// return dResource;
						}
					}
					// var rv = new bootstrap.io.Loader(pp);
					var rv = new bootstrap.io.Loader(source);
					rv.list = function(m) {
						var path = prefix + m.path;
						var rv = bootstrap.loader.paths(path);
						return rv;
					}
					return rv;
				}

				return function(p,prefix) {
					return Loader(p,prefix);
				};
			}
		})();

		var api = (function() {
			if (bootstrap) {
				return bootstrap;
			} else if (isScript($host)) {
				return $host.api;
			}
		})();

		var loaders = (
			/**
			 * @return { { script: slime.Loader, container: slime.Loader, api: slime.Loader } }
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
				var rv = {};
				for (var x in $servlet.parameters) {
					rv[x] = String($servlet.parameters[x]);
				}
				return rv;
			} else if (isScript($host)) {
				return $host.parameters;
			}
		})();

		var $code = (function() {
			if ($servlet) {
				var path = String($servlet.path);
				var tokens = path.split("/");
				var basename = tokens[tokens.length-1];
				return function(scope) {
					Packages.java.lang.System.err.println("Loading servlet from " + path);
					loaders.script.run(basename,scope);
				};
			} else if (isScript($host)) {
				return $host.getCode;
			} else {
				throw new Error();
			}
		}).call(this);

		scope.httpd = {
			$java: (function() {
				if ($java && $servlet) return $java;
				if (isScript($host)) return $host.$java;
			})(),
			loader: (loaders.container) ? loaders.container : void(0),
			js: api.js,
			java: api.java,
			io: api.io,
			web: api.web,
			http: void(0),
			Handler: void(0)
		};

		loaders.api.run(
			"loader.js",
			{
				$exports: scope.httpd,
				$context: {
					api: {
						web: scope.httpd.js.web
					}
				},
				$loader: loaders.api
			}
		);

		if (loaders.script) {
			//	TODO	this should be a module loader, basically, for the code itself, so should somehow resolve relative paths in the
			//			global loader; in the jsh embedding, it should resolve them relative to the current directory of the script
			scope.$loader = loaders.script;
		}

		scope.$parameters = $parameters;

		$code(scope);

		/**
		 * @type { slime.servlet.internal.server.Exports }
		 */
		var server = (function() {
			if (isScript($host)) {
				return $host.server;
			} else if ($servlet) {
				return loaders.container.module("WEB-INF/server.js", {
					api: api
				});
			}
		})();

		var servlet = new server.Servlet(scope.$exports);

		scope.httpd.$reload = (isScript($host)) ? function() {
			servlet.destroy();
			$code(scope);
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
