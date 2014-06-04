plugin({
	isReady: function() {
		return Boolean(jsh.shell.PATH.getCommand("mvn"));
	},
	load: function() {
		if (!global.maven && !global.mvn) {
			global.maven = new function() {
				var mvn = jsh.shell.PATH.getCommand("mvn");
				
				var core = $loader.module("core.js", {
					mvn: mvn
				});
				
				this.mvn = core.mvn;
				this.Project = core.Project;
				this.Pom = core.Pom;
			};
		}
	}
});
