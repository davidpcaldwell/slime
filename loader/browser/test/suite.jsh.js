var parameters = jsh.script.getopts({
	options: {
		suite: jsh.file.Pathname,
		parameter: jsh.script.getopts.ARRAY(String),
		interactive: false,
		"chrome:instance": jsh.file.Pathname,
		view: String,
		"verbose:events": false
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
	var uri = "http://127.0.0.1:" + tomcat.port + "/" + "loader/browser/test/suite.html" + "?suite=" + toSuite.relative + command;
	parameters.options.parameter.forEach(function(argument) {
		uri += "&" + argument;
	});
	chrome.run({
		uri: uri,
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
			var json = JSON.parse(string);
			return json;
		}
	});
	var SUITE = false;
	var FORMAT = true;
	if (SUITE) {
		var suite = new jsh.unit.Suite({
			parts: {
				scenario: new jsh.unit.Scenario.Events({
					events: result.events
				})
			}
		});
		jsh.unit.interface.create(suite, {
			view: "stdio"
		});
	} else {
		var jsonError = function(error) {
			if (error) {
				return {
					type: error.type,
					message: error.message,
					stack: error.stack
				}
			} else {
				return void(0);
			}
		};
		
		var output = jsh.shell.echo;

		result.events.forEach(function(event) {
			// TODO: option was for debugging so can probably be removed
			if (parameters.options["verbose:events"]) {
				if (event.type == "scenario") {
					if (event.detail.start) {
						jsh.shell.console("start: " + event.detail.start.name);
					} else if (event.detail.end) {
						jsh.shell.console("end: " + event.detail.end.name);						
					}
				} else {
					jsh.shell.console("test: " + event.detail.success + " " + event.detail.message);
				}
			}
			
			// jsh.shell.console("");
			if (parameters.options.view == "stdio") {
				if (FORMAT) {
					// TODO: below cribbed from loader/api/unit.js; can this be recombined somehow to use the more standard
					// test event constructs?
					if (event.type == "scenario" && event.detail.start) {
						output(
							JSON.stringify({ 
								type: "scenario", 
								detail: { start: { name: event.detail.start.name } } 
							})
						);
					} else if (event.type == "scenario" && event.detail.end) {
						output(
							JSON.stringify({
								type: "scenario",
								detail: { end: { name: event.detail.end.name }, success: event.detail.success }
							})					
						)
					} else if (event.type == "test") {
						output(JSON.stringify({
							type: "test",
							detail: {
								success: event.detail.success,
								message: event.detail.message,
								error: jsonError(event.detail.error)
							}					
						}));
					} else {
						throw new Error();
					}
				} else {
					//			jsh.shell.echo(JSON.stringify(event));					
				}
			}
		});
	}
	kill();
	jsh.shell.console("Got result: " + result);
	jsh.shell.console("Got success: " + result.success);
	jsh.shell.exit( (result.success) ? 0 : 1 );
}
