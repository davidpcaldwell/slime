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
		return $host.getEngine().script("rhino/rhino.js", $host.getLoader().getLoaderCode("rhino/rhino.js"), { $loader: $host.getLoader(), $engine: $host.getEngine() }, null);
	}	
})();

var scope = {
	$exports: {}
};

var bootstrap = (function() {
	if ($loader && $host.getServletResources) {
		var $rhino = $loader;
		var loader = new $rhino.Loader({
			_source: $host.getServletResources()
		});
		var rv = {};
		rv.js = loader.module("WEB-INF/slime/js/object/", {
			globals: true
		});
		rv.java = loader.module("WEB-INF/slime/rhino/host/", {
			globals: true
		});
		rv.io = loader.module("WEB-INF/slime/rhino/io/", {
			$rhino: $rhino,
			api: {
				js: rv.js,
				mime: loader.module("WEB-INF/slime/js/mime/", {}),
				java: rv.java
			}
		});
		return rv;
	}
})();

var Loader = (function() {
	if (bootstrap) {
		return bootstrap.io.Loader;
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
	if ($loader && $host.getServletResources && $host.getServletScriptPath) {
		//	servlet container, determine webapp path and load relative to that
		var path = String($host.getServletScriptPath());
		var tokens = path.split("/");
		var prefix = tokens.slice(0,tokens.length-1).join("/") + "/";
		Packages.java.lang.System.err.println("Creating application loader with prefix " + prefix);
		return {
			script: new Loader({
				_source: $host.getServletResources().child(prefix),
				type: function(path) {
					var _type = $host.getMimeType(path);
					if (_type) return bootstrap.io.mime.Type.parse(String(_type));
					return null;
				}
			}),
			container: new Loader({
				_source: $host.getServletResources(),
				type: function(path) {
					var _type = $host.getMimeType(path);
					if (_type) return bootstrap.io.mime.Type.parse(String(_type));
					return null;
				}
			})
		};
	} else if ($host.loaders) {
		return $host.loaders;
	} else {
		throw new Error();
	}
})();

var $parameters = (function() {
	if ($host.getServletInitParameters) {
		var _map = $host.getServletInitParameters();
		var rv = {};
		var _entries = _map.entrySet().toArray();
		for (var i=0; i<_entries.length; i++) {
			rv[String(_entries[i].getKey())] = String(_entries[i].getValue());
		}
		return rv;
	} else if ($host.parameters) {
		return $host.parameters;
	}
})();

var $code = (function() {
	if ($host.getServletResources && $host.getServletScriptPath) {
		var path = String($host.getServletScriptPath());
		var tokens = path.split("/");
		var path = tokens[tokens.length-1];
		return function(scope) {
			Packages.java.lang.System.err.println("Loading servlet from " + path);
			loaders.script.run(path,scope);
		};
//		return {
//			name: String($host.getServletScriptPath()),
//			_in: $host.getServletResources().getResourceAsStream($host.getServletScriptPath())
//		};
	} else if ($host.getCode) {
		return $host.getCode;
	} else {
		throw new Error();
	}
})();

scope.httpd = {};

scope.httpd.loader = loaders.container;

scope.httpd.js = api.js;
scope.httpd.java = api.java;
scope.httpd.io = api.io;

var server = (function() {
	if ($host.server) {
		return $host.server;
	} else if ($host.getServletResources) {
		return loaders.container.file("WEB-INF/server.js", {
			api: api
		});
	}
})();

scope.httpd.http = {};

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
}

scope.$loader = (function() {
	//	TODO	this should be a module loader, basically, for the code itself, so should somehow resolve relative paths in the
	//			global loader; in the jsh embedding, it should resolve them relative to the current directory of the script
	return loaders.script;
})();

scope.$parameters = $parameters;

$code(scope);

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