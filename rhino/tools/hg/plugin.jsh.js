plugin(new function() {
	var program;
	
	this.isReady = function() {
		return Boolean(jsh.shell.PATH.getCommand("hg"));
	};
	
	this.load = function() {
		global.hg = $loader.module("module.js", {
			api: {
				js: jsh.js,
				io: jsh.io,
				file: jsh.file,
				shell: jsh.shell,
				time: jsh.time
			},
			install: jsh.shell.PATH.getCommand("hg")
		});
	}
});
