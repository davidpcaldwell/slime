var parameters = jsh.script.getopts({
	options: {
		servlet: jsh.file.Pathname
	}
});
var servlet = parameters.options.servlet.file;
jsh.script.loader.module("webview.jsh.api.js", {
	servlet: servlet
});
