jsh.httpd.plugin.tools();

//	TODO	build servlet .war
var CATALINA_BASE = jsh.shell.TMPDIR.createTemporary({ directory: true });
var war = CATALINA_BASE.getRelativePath("webapps/container.war");
war.parent.createDirectory();
jsh.httpd.tools.build({
	destination: {
		war: war
	},
	compile: [],
	Resources: function() {
		this.add({ prefix: "WEB-INF/main/", directory: jsh.script.file.parent });
	},
	servlet: "WEB-INF/main/echo.servlet.js"
});
jsh.shell.console("Built to " + war);

//	TODO	launch Tomcat with that .war
// var tomcat = new jsh.httpd.Tomcat({
// 	base: CATALINA_BASE
// });
// // tomcat.map({
// // 	path: "",
// // 	webapp: war
// // });
// tomcat.start();
// jsh.shell.console("tomcat started on " + tomcat.port);
// var port = jsh.ip.tcp.getEphemeralPortNumber();
var CATALINA_HOME = jsh.shell.jsh.lib.getSubdirectory("tomcat");

CATALINA_HOME.getFile("conf/server.xml").copy(CATALINA_BASE.getRelativePath("conf/server.xml"), {
	recursive: true
});

var lock = new jsh.java.Thread.Monitor();

var proceed = false;

jsh.java.Thread.start(function() {
	jsh.shell.run({
		command: jsh.file.Pathname("/bin/sh"),
		arguments: [
			CATALINA_HOME.getFile("bin/catalina.sh"),
			"run"
		],
		stdio: {
			output: {
				line: function(line) {
					jsh.shell.echo("STDOUT: " + line);
				},
			},
			error: {
				line: function(line) {
					jsh.shell.console("STDERR: " + line);
					if (/Server startup in/.test(line)) {
						new lock.Waiter({
							until: function() {
								return true;
							},
							then: function() {
								jsh.shell.console("Sending signal to proceed ...");
								proceed = true;
							}
						})();
					}
				}
			}
		},
		environment: Object.assign({}, jsh.shell.environment, {
			CATALINA_BASE: CATALINA_BASE.toString()
		})
	});
});

var client = new jsh.http.Client();
new lock.Waiter({
	until: function() {
		return proceed;
	},
	then: function() {
		jsh.shell.console("Proceeding ...");
	}
})();

var response = client.request({
	url: "http://127.0.0.1:8080/container/",
	evaluate: function(response) {
		if (response.status.code != 200) throw new Error("Response code: " + response.status.code);
		return response.body.stream.character().asString();
	}
});

jsh.shell.run({
	command: jsh.file.Pathname("/bin/sh"),
	arguments: [
		CATALINA_HOME.getFile("bin/catalina.sh"),
		"stop"
	],
	environment: Object.assign({}, jsh.shell.environment, {
		CATALINA_BASE: CATALINA_BASE.toString()
	})
});

if (response == "Requested path: []") {
	jsh.shell.console("Got expected output; exiting with success.");
	jsh.shell.exit(0);
} else {
	jsh.shell.console("Bad response: " + response);
	jsh.shell.exit(1);
}
