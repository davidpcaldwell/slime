(function() {
	var $javahost = new function() {
		this.getLoaderCode = function(path) {
			return $loader.getLoaderCode(path);
		};

		//	TODO	is this indirection object unnecessary?
		var classpath = new function() {
			this.append = function(code) {
				$engine.getClasspath().append(code);
			};

			this.getClass = function(name) {
				return $engine.getClasspath().getClass(name);
			}
		};

		this.getClasspath = function() {
			return classpath;
		};

		this.script = function(name,code,scope,target) {
			return $engine.script(name,code,$engine.toScope(scope),target);
		};
	};
	
	return $javahost.script("rhino/literal.js", $loader.getLoaderCode("rhino/literal.js"), $engine.toScope({ $javahost: $javahost }), null);
})()
