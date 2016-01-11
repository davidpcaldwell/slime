plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		//	Would not work in Google App Engine because of use of sandboxed classes
		var context = $loader.file("context.java.js");
		//	TODO	load Java context
		jsh.time = $loader.module("module.js", context);
	}
})