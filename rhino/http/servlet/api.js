var scope = {
	$loader: $loader,
	$exports: {}
};

scope.httpd = {};

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

$loader.run($code, scope);
register(scope.$exports);
