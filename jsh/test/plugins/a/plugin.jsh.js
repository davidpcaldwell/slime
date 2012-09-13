plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		global.a = $loader.module("module.js", {
			log: function(s) {
				jsh.shell.echo("[global] " + s);
			}
		});
		jsh.a = $loader.module("module.js", {
			log: function(s) {
				jsh.shell.echo(s);
			}
		});
	}
})