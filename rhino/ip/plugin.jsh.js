plugin({
	isReady: function() {
		return jsh.shell;
	},
	load: function() {
		jsh.ip = $loader.module("module.js", {
			api: {
				shell: jsh.shell
			}
		});
	}
});
