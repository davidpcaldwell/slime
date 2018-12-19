var parameters = jsh.script.getopts({
	options: {
		suite: jsh.file.Pathname,
		interactive: false,
		"chrome:instance": jsh.file.Pathname
	}
});

//	We need to serve from the common ancestor of:
//	* the suite
//	* the launching page
//	* the SLIME installation that will load the page and run it

var toSuite = jsh.file.navigate({
	from: jsh.shell.jsh.src.getFile("loader/browser/test/suite.js"),
	to: parameters.options.suite.file
});

var toShell = jsh.file.navigate({
	from: toSuite.base,
	to: jsh.shell.jsh.src
});

var toResult = jsh.file.navigate({
	from: toShell.base,
	to: jsh.shell.jsh.src.getFile("loader/browser/test/suite.js"),
});

var url = toResult.relative.replace(/suite\.js/g, "result");

// TODO: automated test cases for this script. Manual test cases for now:
// rhino/jrunscript/api.js
// loader/browser/test/test/sample-suite.
// $HOME/.bash_profile

//var url = "foo";

var resultServletFile = jsh.shell.jsh.src.getFile("jsh/test/browser.servlet.js");

var tomcat = new jsh.httpd.Tomcat();
tomcat.map({
	// TODO: make the below the default for goodness' sake
	path: "",
	resources: new jsh.file.Loader({
		directory: toShell.base
	}),
	servlets: {
		"/*": {
			load: function(scope) {
				jsh.shell.console("Serving " + toShell.base);
				var resultServlet = (function() {
					var rv = {};
					jsh.loader.run(resultServletFile.pathname, {
						httpd: scope.httpd,
						$parameters: {
							url: url
						},
						$exports: rv
					});
					return rv;
				})();

				scope.$exports.handle = scope.httpd.Handler.series(
					function(request) {
						jsh.shell.console("REQUEST: " + request.method + " " + request.path);
					},
					function(request) {
						if (!parameters.options.interactive) return resultServlet.handle(request);
					},
					new scope.httpd.Handler.Loader({
						loader: new jsh.file.Loader({
							directory: toShell.base
						})
					})
				)
			}
		}
	}
});
tomcat.start();
jsh.shell.console("port = " + tomcat.port);
jsh.shell.console("path = " + url);
var chrome = new jsh.shell.browser.chrome.Instance({
	location: parameters.options["chrome:instance"]
});
var kill;
var command = (parameters.options.interactive) ? "" : "&command=run";
jsh.java.Thread.start(function() {
	// TODO: query string by string concatenation is sloppy
	// TODO: probably should just be suite.html, not suite.api.html
	chrome.run({
		uri: "http://127.0.0.1:" + tomcat.port + "/" + "loader/browser/test/suite.api.html" + "?suite=" + toSuite.relative + command,
		on: {
			start: function(p) {
				kill = function() {
					p.kill();
				}
			}
		}
	});
});

if (!parameters.options.interactive) {
	jsh.shell.console("Requesting result.");
	var result = new jsh.http.Client().request({
		url: "http://127.0.0.1:" + tomcat.port + "/" + url,
		evaluate: function(response) {
			var string = response.body.stream.character().asString();
			if (string == "true") return true;
			if (string == "false") return false;
			throw new Error("Got [" + string + "]");
		}
	});
	kill();
	jsh.shell.console("Got result: " + result);
	jsh.shell.exit( (result) ? 0 : 1 );
}
