plugin({
	isReady: function() {
		return jsh.java && jsh.java.getClass("com.mongodb.Mongo");
	},
	load: function() {
		if (!jsh.db) jsh.db = {};
		jsh.db.mongo = $loader.module("module.js", {
			api: {
				java: jsh.java
			}
		});
	}
});
