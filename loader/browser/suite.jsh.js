var parameters = jsh.script.getopts({
	options: {
		//	Run tests in default browser only, rather than all browsers
		"default": false,
		view: "console",
	},
	unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
});

//	Browsers in precedence order: whichever is first in the array will be used if only one is being used
var browsers = [];

if (jsh.shell.browser.chrome) {
	browsers.push("Chrome");
	// browsers.push(new Chrome({
	// 	location: parameters.options["chrome:instance"]		
	// }));
}

["IE","Firefox","Safari"].forEach(function(name) {
	if (jsh.unit.browser.installed[name.toLowerCase()]) {
		browsers.push(name);
	}
	// var browser = jsh.unit.browser.installed[name.toLowerCase()];
	// if (browser) {
	// 	var b = new Browser(browser.delegate);
	// 	b.name = name;
	// 	browsers.push(b);
	// }
});

// TODO: allow set of browsers to be specified on command line

if (parameters.options["default"]) {
	browsers = browsers.slice(0,1);
}

var suite = new jsh.unit.Suite();
browsers.forEach(function(browser) {
	suite.part(browser, new jsh.unit.Suite.Fork({
		run: jsh.shell.jsh,
		shell: jsh.shell.jsh.src,
		script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
		arguments: [
			"-suite", jsh.script.file.parent.getFile("suite.js"),
			"-browser", browser.toLowerCase(),
			"-view", "stdio"
		].concat(parameters.arguments)
	}));	
})
jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
