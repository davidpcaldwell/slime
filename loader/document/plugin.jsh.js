plugin({
	isReady: function() {
		return jsh.document;
	},
	load: function() {
		var module = $loader.module("module.js", {
			$slime: $slime
		});
		jsh.document.load = function(p) {
			return module.load(p);
		};
	}
})