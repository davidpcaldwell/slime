plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		jsh.a = $loader.module("module.js", {
			log: function(s) {
				jsh.shell.echo(s);
			}
		});
	}
})