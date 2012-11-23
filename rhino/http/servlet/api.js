var scope = {
	$exports: {}
};

var $loader = (function() {
	if ($host.getServletResource) {
		throw new Error("Unimplemented");
		//	servlet container, determine webapp path and load relative to that
	} else if ($host.loaders) {
		return $host.loaders.script;
	} else {
		throw new Error();
	}
})();

var $code = (function() {
	if ($host.getServletResources && $host.getServletScriptPath) {
		throw new Error("Unimplemented");
	} else if ($host.code) {
		return $host.code;
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

scope.httpd = {};

scope.httpd.loader = resources;

var server = (function() {
	if ($host.server) {
		return $host.server;
	} else if ($host.getServletResources) {
		return resources.file("WEB-INF/slime/loader/server.js");
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

var servlet = new $context.Servlet(scope.$exports);

if ($host.$exports) {
	$host.$exports.servlet = servlet;
} else if ($host.register) {
	$host.register(new JavaAdapter(
		Packages.inonit.script.servlet.Servlet.Script,
		servlet
	));	
}

