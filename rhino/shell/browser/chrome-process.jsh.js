var program = jsh.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file;
var user = jsh.shell.HOME.getSubdirectory("Library/Application Support/Google/Chrome");
var api = jsh.script.loader.file("chrome-process.js", {
	os: jsh.shell.os,
	program: program,
	user: user
});

jsh.script.Application.run(new function() {
	this.commands = new function() {
		this.list = {
			getopts: {},
			run: function(parameters) {
				var chromes = api.getChromeProcesses();
				jsh.shell.console(JSON.stringify(chromes.map(function(chrome) {
					return {
						id: chrome.id,
						command: chrome.command,
						chrome: chrome.chrome
					}
				}),void(0),"    "));
			}
		};

		this.test = {
			getopts: {},
			run: function(parameters) {
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.shell.console("running before: " + api.isRunning(tmp));
				var instance = new jsh.shell.browser.chrome.Instance({ directory: tmp });
				jsh.shell.console("running constructed: " + api.isRunning(tmp));
				instance.run({
					url: "about:blank",
					on: {
						start: function(e) {
							jsh.shell.console("running during: " + api.isRunning(tmp));
						}
					}
				});
				jsh.shell.console("running after: " + api.isRunning(tmp));
			}
		}
	}
});
