plugin({
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.io) != "undefined";
	},
	load: function() {
		jsh.http = $loader.module("module.js", {
			api: {
				io: jsh.io,
				js: jsh.js
			}
		});
	}
});