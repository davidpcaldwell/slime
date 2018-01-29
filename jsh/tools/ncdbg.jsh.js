var parameters = jsh.script.getopts({
	options: {
		"chrome:instance": jsh.file.Pathname
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

var properties = {
	"jsh.debug.jdwp": "transport=dt_socket,address=7777,server=y,suspend=y",
	"jsh.engine": "nashorn"
};

var url = "chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=localhost:7778/dbg";

var lock = new jsh.java.Thread.Monitor();
var finished;
var browser;

var chrome = new jsh.shell.browser.chrome.Instance({
	location: parameters.options["chrome:instance"]
});

jsh.java.Thread.start(function() {
	debugger;
	chrome.run({
		uri: url,
		on: {
			start: function(process) {
				browser = process;
			}
		}
	});
});

jsh.java.Thread.start(function() {
	//	TODO	ideally would detect emission of startup message
	jsh.shell.jrunscript({
		properties: properties,
		arguments: [
			jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
			"jsh"
		].concat(parameters.arguments)
	});
	lock.Waiter({
		until: function() {
			return true;
		},
		then: function() {
			finished = true;
		}
	})();
});

if (true) {
	Packages.java.lang.Thread.currentThread().sleep(5000);
	var JAVA_HOME = jsh.shell.java.home.parent;
	jsh.shell.run({
		command: jsh.shell.jsh.lib.getRelativePath("ncdbg/bin/ncdbg"),
		directory: jsh.shell.jsh.lib.getSubdirectory("ncdbg"),
		environment: jsh.js.Object.set({}, jsh.shell.environment, {
			JAVA_HOME: JAVA_HOME.toString()
		})
	});
}

lock.Waiter({
	until: function() {
		return finished;
	},
	then: function() {
		jsh.shell.console("Finished.");
		try {
			browser.kill();
		} catch (e) {
			jsh.shell.console("Error killing browser: browser");
		}
	}
})();
