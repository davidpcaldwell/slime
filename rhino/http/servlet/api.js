var scope = {
	$exports: {}
};

var $loader = (function() {
	if ($host.getServletResources && $host.getServletScriptPath) {
		//	servlet container, determine webapp path and load relative to that
		var path = String($host.getServletScriptPath());
		var tokens = path.split("/");
		var rv = tokens.slice(0,tokens.length-1).join("/") + "/";
		Packages.java.lang.System.err.println("Creating application loader with prefix " + rv);
		var Loader = $host.getRhinoLoader().Loader;
		return new Loader({
			_source: Packages.inonit.script.rhino.Code.Source.create($host.getServletResources(), rv)
		});
	} else if ($host.loaders) {
		return $host.loaders.script;
	} else {
		throw new Error();
	}
})();

var resources = (function() {
	if ($host.getRhinoLoader && $host.getServletResources) {
		var rhinoLoader = $host.getRhinoLoader();
		return new rhinoLoader.Loader({
			_source: $host.getServletResources()
		});
	} else if ($host.loaders) {
		return $host.loaders.container;
	}
})();

var $code = (function() {
	if ($host.getServletResources && $host.getServletScriptPath) {
		var path = String($host.getServletScriptPath());
		var tokens = path.split("/");
		return tokens[tokens.length-1];
//		return {
//			name: String($host.getServletScriptPath()),
//			_in: $host.getServletResources().getResourceAsStream($host.getServletScriptPath())
//		};
	} else if ($host.code) {
		return $host.code;
	} else {
		throw new Error();
	}
})();

scope.httpd = {};

scope.httpd.loader = resources;

var server = (function() {
	if ($host.server) {
		return $host.server;
	} else if ($host.getServletResources) {
		return resources.file("WEB-INF/server.js");
	}
})();

scope.httpd.http = {};

scope.httpd.http.Response = function() {
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
})();

$loader.run($code, scope);

var servlet = new server.Servlet(scope.$exports);

if ($host.$exports) {
	$host.$exports.servlet = servlet;
} else if ($host.register) {
	$host.register(new JavaAdapter(
		Packages.inonit.script.servlet.Servlet.Script,
		servlet
	));	
}

