plugin({
	isReady: function() {
		return jsh.java && jsh.java.tools && jsh.java.getClass("org.openqa.selenium.By");
	},
	load: function() {
		jsh.java.tools.selenium = $loader.module("module.js");
	}
});
