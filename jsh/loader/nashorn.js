var $host = (function() {
	var $loader = eval($jsh.getLoaderCode());
	var scripts = eval($loader.getLoaderCode("rhino/nashorn.js"));
	
	var rv = scripts.script(
		"rhino/nashorn.js",
		$loader.getLoaderCode("rhino/nashorn.js"),
		{
			Java: Java,
			Packages: Packages,
			load: load,
			$getLoaderCode: function(path) {
				return $loader.getLoaderCode(path);
			},
			$getCoffeeScript: function() {
				if (!$loader.getCoffeeScript) throw new Error("No getCoffeeScript in jsh/nashorn.js");
				return $loader.getCoffeeScript();
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
				if (e.getClass && e.getClass().getName().equals("inonit.script.jsh.Nashorn$UncaughtException")) {
					e = e.getCause();
				}
				if (e.printStackTrace) {
					e.printStackTrace();
				}
				return 255;
			}
		});
	}
	
	return rv;
})();

