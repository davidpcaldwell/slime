var parameters = jsh.script.getopts({
	options: {
		interactive: false,
		"chrome:profile": jsh.file.Pathname,
		port: Number
	}
});

if (!parameters.options["chrome:profile"]) {
	parameters.options["chrome:profile"] = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname
	parameters.options["chrome:profile"].directory.getRelativePath("First Run").write("", { append: false });
}

var SLIME = new jsh.file.Loader({ directory: jsh.script.file.parent.parent.parent.parent });

var lock = new jsh.java.Thread.Monitor();
var result = {
	received: function(v) {
		var self = this;
		//	TODO	lock.Waiter may not have intelligent 'this' handling
		lock.Waiter({
			until: function() { return true; },
			then: function() {
				self.success = v;
			}
		})();
	}
};

var tomcat = new jsh.httpd.Tomcat({ port: parameters.options.port });
tomcat.map({
	path: "/",
	servlets: {
		"/*": {
			load: function(scope) {
				scope.$exports.handle = function(request) {
					if (request.path == "loader/api/test/result") {
						var json = request.body.stream.character().asString();
						jsh.shell.console("Got " + json);
						result.received(JSON.parse(json));
						return { status: { code: 200 } };
					}
					if (SLIME.get(request.path)) {
						return {
							status: { code: 200 },
							body: SLIME.get(request.path)
						}
					} else {
						return {
							status: { code: 404 }
						}
					}
				}
			}
		}
	}
});

tomcat.start();

var chrome = new jsh.shell.browser.chrome.User({ 
	directory: parameters.options["chrome:profile"].createDirectory({
		ifExists: function(dir) {
			return false;
		}
	})
});

if (parameters.options.interactive) {
	chrome.run({
		uri: "http://127.0.0.1:" + tomcat.port + "/loader/api/test/browser.html"
	});
} else {
	var opened;

	var on = {
		start: function(p) {
			new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					opened = new function() {
						this.close = function() {
							jsh.shell.echo("Killing browser process " + p + " ...");
							p.kill();
							jsh.shell.echo("Killed.");
						}
					}
				}
			})();
		}
	};
	
	chrome.launch({
		uri: "http://127.0.0.1:" + tomcat.port + "/loader/api/test/browser.html?unit.run",
		on: on
	});
	
	new lock.Waiter({
		until: function() { return Boolean(opened); },
		then: function() {
			jsh.shell.console("opened = " + opened);			
		}
	})();
	
	new lock.Waiter({
		until: function() { return typeof(result.success) != "undefined" },
		then: function() {	
		}
	})();
	
	jsh.shell.console("result.success = " + result.success);
	opened.close();
	if (result.success === false) {
		jsh.shell.console("Success.");
		jsh.shell.exit(0);
	} else {
		jsh.shell.console("Failure.");
		jsh.shell.exit(1);
	}
}