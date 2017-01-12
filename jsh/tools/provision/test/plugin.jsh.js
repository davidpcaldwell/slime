plugin({
	isReady: function() {
		return jsh.test;
	},
	load: function() {
		jsh.test.provision = {};
		jsh.test.provision.Server = function(o) {
			var server = new jsh.test.mock.Internet();
			server.add(jsh.test.mock.Internet.bitbucket(o.bitbucket));
			return server;
		}
	}
})