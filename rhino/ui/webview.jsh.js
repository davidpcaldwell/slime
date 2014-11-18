var parameters = jsh.script.getopts({
	options: {
		servlet: jsh.file.Pathname
	}
});
var servlet = parameters.options.servlet.file;
var run = jsh.script.loader.value("webview.jsh.api.js", {
	$loader: jsh.script.loader
});
run({ servlet: servlet });

