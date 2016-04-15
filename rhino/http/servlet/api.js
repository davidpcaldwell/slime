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

var $loader = (function() {
	if ($host.getLoader && $host.getEngine) {
		return $host.getEngine().script("rhino/rhino.js", $host.getLoader().getLoaderCode("rhino/rhino.js"), { $loader: $host.getLoader(), $rhino: $host.getEngine() }, null);
	} else if ($host.getLoader && $host.getClasspath) {
		var scripts = eval($host.getLoader().getLoaderCode("rhino/nashorn.js"));

		var rv = scripts.script(
			"rhino/nashorn.js",
			$host.getLoader().getLoaderCode("rhino/nashorn.js"),
			{
				$getLoaderCode: function(path) {
					return $host.getLoader().getLoaderCode(path);
				},
				$classpath: $host.getClasspath(),
				$getCoffeeScript: function() {
					return $host.getCoffeeScript();
				}
			},
			null
		);
		return rv;
	}
})();

var $servlet = (function() {
	if ($host.getServlet) {
		var rv = {};
		rv.resources = Packages.inonit.script.engine.Code.Source.create($host.getServlet().getServletConfig().getServletContext().getResource("/"));
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

var scope = {
	$exports: {}
};

var bootstrap = (function() {
	if ($loader && $servlet) {
		var $rhino = $loader;
		var loader = new $rhino.Loader({
			_source: $servlet.resources
		});
		var rv = {};
		rv.js = loader.module("WEB-INF/slime/js/object/", {
			globals: true
		});
		rv.js.web = loader.module("WEB-INF/slime/js/web/", loader.file("WEB-INF/slime/js/web/context.java.js"));
		rv.java = loader.module("WEB-INF/slime/rhino/host/", {
			globals: true,
			$rhino: $loader,
			$java: $loader.java
		});
		rv.java.log = loader.file("WEB-INF/slime/js/debug/logging.java.js", {
			prefix: "slime",
			api: {
				java: rv.java
			}
		}).log;
		rv.io = loader.module("WEB-INF/slime/rhino/io/", {
			$rhino: $rhino,
			api: {
				js: rv.js,
				mime: $rhino.mime,
				java: rv.java
			}
		});
		rv.loader = {
			paths: function(prefix) {
				return $servlet.getResourcePaths(prefix);
			}
		}
		return rv;
	}
})();

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
			pp.Loader = function(sub) {
				return new Loader(p,prefix+sub);
			}
			var source = {
				get: function(path) {
					var delegate = new bootstrap.io.Loader(pp);
					var dResource = delegate.source.get(path);
					if (dResource && !dResource.type) {
						dResource.type = pp.type(path);
					}
					return dResource;
				}
			}
//			var rv = new bootstrap.io.Loader(pp);
			var rv = new bootstrap.io.Loader(source);
			rv.list = function(m) {
				var path = prefix + m.path;
				var rv = bootstrap.loader.paths(path);
				return rv;
			}
			return rv;
		}

		return function(p,prefix) {
			return new Loader(p,prefix);
		};
	}
})();

var api = (function() {
	if (bootstrap) {
		return bootstrap;
	} else if ($host.api) {
		return $host.api;
	}
})();

var loaders = (function() {
	if ($loader && $servlet) {
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
			api: new loader.Child("WEB-INF/slime/rhino/http/servlet/server/")
		};
	} else if ($host.loaders) {
		return $host.loaders;
	} else {
		throw new Error();
	}
})();

var $parameters = (function() {
	if ($servlet) {
		var rv = {};
		for (var x in $servlet.parameters) {
			rv[x] = String($servlet.parameters[x]);
		}
		return rv;
	} else if ($host.parameters) {
		return $host.parameters;
	}
})();

var $code = (function() {
	if ($servlet) {
		var path = String($servlet.path);
		var tokens = path.split("/");
		var path = tokens[tokens.length-1];
		return function(scope) {
			Packages.java.lang.System.err.println("Loading servlet from " + path);
			loaders.script.run(path,scope);
		};
	} else if ($host.getCode) {
		return $host.getCode;
	} else {
		throw new Error();
	}
}).call(this);

scope.httpd = {};
scope.httpd.$java = (function() {
	if ($loader && $servlet) return $loader;
	return $host.$java;
})();

if (loaders.container) {
	scope.httpd.loader = loaders.container;
}

scope.httpd.js = api.js;
scope.httpd.java = api.java;
scope.httpd.io = api.io;

scope.httpd.http = {};

if (!loaders.api.get("loader.js")) {
	throw new Error("loader.js not found in " + loaders.api);
}

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

scope.httpd.http.Response = function() {
	throw new Error("Reserved for future use.");
};

scope.httpd.http.Response.text = function(string) {
	return {
		status: {
			code: 200
		},
		headers: [],
		body: {
			type: "text/plain",
			string: string
		}
	};
};

scope.httpd.http.Response.javascript = function(p) {
	if (typeof(p) == "string") {
		return {
			status: { code: 200 },
			body: {
				type: "text/javascript",
				string: p
			}
		}
	} else {
		throw new Error("'p' must be string");
	}
}

if (loaders.script) {
	//	TODO	this should be a module loader, basically, for the code itself, so should somehow resolve relative paths in the
	//			global loader; in the jsh embedding, it should resolve them relative to the current directory of the script
	scope.$loader = loaders.script;
}

scope.$parameters = $parameters;

$code(scope);

var server = (function() {
	if ($host.server) {
		return $host.server;
	} else if ($servlet) {
		return loaders.container.module("WEB-INF/server.js", {
			api: api
		});
	}
})();

var servlet = new server.Servlet(scope.$exports);

scope.httpd.$reload = ($host.getCode) ? function() {
	servlet.destroy();
	$code(scope);
	servlet.reload(scope.$exports);
} : null;

if ($host.$exports) {
	$host.$exports.servlet = servlet;
} else if ($host.register) {
	$host.register(new JavaAdapter(
		Packages.inonit.script.servlet.Servlet.Script,
		servlet
	));
}