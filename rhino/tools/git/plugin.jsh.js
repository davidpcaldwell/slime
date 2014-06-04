plugin({
	isReady: function() {
		return Boolean(jsh.shell.PATH.getCommand("git"));
	},
	load: function() {
		global.git = $loader.module("module.js", {
			program: jsh.shell.PATH.getCommand("git")
		});
	}
})