var $host = (function() {
	//	Try to port inonit.script.rhino.Loader.Bootstrap
	var $loader = eval(String($shell.getLoaderCode()));
	
	var rv = $rhino.script("rhino/rhino.js", $loader.getLoaderCode("rhino/rhino.js"), { $loader: $loader, $rhino: $rhino }, null);
	
	rv.exit = function(status) {
		return $rhino.exit(status);
	};
	
	rv.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};
	
	return rv;
})();
