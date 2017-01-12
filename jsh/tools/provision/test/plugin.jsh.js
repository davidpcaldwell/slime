plugin({
	isReady: function() {
		return jsh.test;
	},
	load: function() {
		jsh.test.provision = {};
		jsh.test.provision.Server = function(o) {
			var server = new jsh.test.mock.Internet();
			var bitbucket = o.bitbucket;
			if (!o.bitbucket.src.davidpcaldwell) o.bitbucket.src.davidpcaldwell = {};
			if (!o.bitbucket.src.davidpcaldwell.slime) {
				o.bitbucket.src.davidpcaldwell.slime = {
					directory: jsh.shell.jsh.src,
					downloads: {
						"jdk-8u112-macosx-x64.dmg": jsh.shell.user.downloads.getFile("jdk-8u112-macosx-x64.dmg")
					}
				};
			}
			server.add(jsh.test.mock.Internet.bitbucket(bitbucket));
			return server;
		}
	}
})