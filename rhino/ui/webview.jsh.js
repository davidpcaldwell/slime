var parameters = jsh.script.getopts({
	options: {
		servlet: jsh.file.Pathname
	}
});
jsh.ui.javafx.WebView.application({ servlet: parameters.options.servlet.file });
