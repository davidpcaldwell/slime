plugin({
	isReady: function() {
		return jsh.java && jsh.io && jsh.io.mime && jsh.loader.$getClass("javax.mail.Session") != null;
	},
	load: function() {
		jsh.mail = $loader.module("module.js", {
			api: {
				java: jsh.java,
				mime: jsh.io.mime
			}
		});
	}
})