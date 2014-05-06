var $engine = new function() {
};
$engine.$javaloader = (function() {
	var _streams = new Packages.inonit.script.runtime.io.Streams();

	var $bootstrap = new function() {
		this.getLoaderCode = function(path) {
			return _streams.readString($shell.getInstallation().getPlatformLoader(path).getReader());
		};
	}

	//	Try to port inonit.script.rhino.Loader.Bootstrap
	var rv = $rhino.script("rhino/rhino.js", $bootstrap.getLoaderCode("rhino/rhino.js"), { $loader: $bootstrap, $rhino: $rhino }, null);
	
	rv.exit = function(status) {
		return $rhino.exit(status);
	};
	
	rv.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};
	
	return rv;
})();
