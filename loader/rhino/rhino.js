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
			return $bootstrap.getLoaderCode(path);
		}

		this.script = function(name,code,scope,target) {
			return $rhino.script(name,code,scope,target);
		};

		this.getClasspath = function() {
			if (!$rhino.getApplicationClassLoader()) return null;
			return $rhino.getApplicationClassLoader().toScriptClasspath();
		};
	};

	return $rhino.script("rhino/literal.js", $bootstrap.getLoaderCode("rhino/literal.js"), { $javahost: $javahost }, null);
})()
