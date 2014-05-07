var $host = (function() {
	var $loader = eval($jsh.getLoaderCode());
	var scripts = eval($loader.getLoaderCode("rhino/nashorn.js"));
	
	var rv = scripts.script(
		"rhino/nashorn.js",
		$loader.getLoaderCode("rhino/nashorn.js"),
		{ 
			$getLoaderCode: function(path) {
				return $loader.getLoaderCode(path);
			},
			$classpath: $nashorn.getClasspath() 
		},
		null
	);
	
	rv.jsapi = new function() {
		this.script = function(name,code,scope) {
			return scripts.script(name, code, scope);
		}
	}
	
	rv.exit = function(status) {
		if ($nashorn.isTop()) {
			exit(status);
		} else {
			//	NASHORN	Throwing object with toString() causes [object Object] to be error rather than toString()
			$nashorn.exit(status);
		}
	}
	
	rv.jsh = function(configuration,invocation) {
		return scripts.subshell(function() {
			try {
				return Packages.inonit.script.jsh.Nashorn.execute($jsh.subshell(configuration,invocation));				
			} catch (e) {
				return 255;
			}
		});
	}
	
	return rv;
})();

