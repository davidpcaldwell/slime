plugin({
	isReady: function() {
		return Boolean(jsh.js) && Boolean(jsh.java) && Boolean(jsh.shell);
	},
	load: function() {
		if (!jsh.db) jsh.db = {};
		//	Try to find Derby
		//	Not present with Apple JDK 6
		if (jsh.shell.java.home.getSubdirectory("db")) {
			jsh.loader.java.add(jsh.shell.java.home.getSubdirectory("db").getRelativePath("lib/derby.jar"));
		}
		//	TODO	this does not seem to be a complete list of context properties
		jsh.db.jdbc = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java,
				io: jsh.io
			},
			getJavaClass: function(name) {
				return jsh.java.getClass(name);
			}
		});
	}
})