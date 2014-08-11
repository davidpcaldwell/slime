plugin({
	isReady: function() {
		return jsh.js;
	},
	load: function() {
		jsh.js.web = $loader.module("module.js", $loader.file("context.java.js"));
	}
});
