(function() {
	var $javahost = new function() {
		this.setReadOnly = function(object,name,value) {
			if (!arguments.callee.objects) {
				arguments.callee.objects = new Packages.inonit.script.rhino.Objects();
			}
			arguments.callee.objects.setReadOnly(object,name,value);							
		};

		this.MetaObject = function(p) {
			var delegate = (p.delegate) ? p.delegate : {};
			var get = (p.get) ? p.get : function(){};
			var set = (p.set) ? p.set : function(){};
			return Packages.inonit.script.rhino.MetaObject.create(delegate,get,set);
		};

		this.getLoaderCode = function(path) {
			return $loader.getLoaderCode(path);
		}

		this.script = function(name,code,scope,target) {
			return $engine.script(name,code,scope,target);
		};

		this.getClasspath = function() {
			if (!$engine.getApplicationClassLoader()) return null;
			return $engine.getApplicationClassLoader().toScriptClasspath();
		};
	};

	return $engine.script("rhino/literal.js", $loader.getLoaderCode("rhino/literal.js"), { $javahost: $javahost }, null);
})()
