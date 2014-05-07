var $engine = {};
var $javaloader = (function() {
	var scripts = eval($loader.getLoaderCode("rhino/nashorn.js"));
	var $engine = new function() {
		this.script = function(name,code,scope,target) {
			var context = scripts.Context.getContext();
			var notNull = function(o) {
				return (o) ? o : {};
			}
			return scripts.evaluateSource.invoke(context, new scripts.Source(name,code), notNull(scope), notNull(target));
		};
		this.getClasspath = function() {
			return $nashorn.getClasspath();
		}

		var fakeDebugger = new function() {
			this.setBreakOnExceptions = function(b) {
			};

			this.isBreakOnExceptions = function() {
				return false;
			}
		};

		this.getDebugger = function() {
			return fakeDebugger;
		}

		this.exit = function(status) {
			if ($nashorn.isTop()) {
				exit(status);
			} else {
				//	NASHORN	Throwing object with toString() causes [object Object] to be error rather than toString()
				throw new Packages.inonit.script.jsh.Nashorn.ExitException(status);
			}
		}

		this.jsh = function(configuration,invocation) {
			var subshell = Packages.inonit.script.jsh.Shell.create(
				$shell.getInstallation(),
				configuration,
				invocation
			);
			var global = (function() { return this; })();
			var subglobal = scripts.Context.getContext().createGlobal();
			scripts.Context.setGlobal(subglobal);
			try {
				return Packages.inonit.script.jsh.Nashorn.execute(subshell);
			} catch (e) {
				return 255;
			} finally {
				scripts.Context.setGlobal(global);
			}
	//		Integer rv = Rhino.execute(subshell, this.rhino, subinterface());
	//		debugger.setBreakOnExceptions(breakOnExceptions);
	//		if (rv == null) return 0;
	//		return rv.intValue();		
		}

		//	TODO	setReadOnly?
		//	TODO	MetaObject?
	};

	var rv = $engine.script(
		"rhino/nashorn.js",
		$loader.getLoaderCode("rhino/nashorn.js"),
		scripts.toScope({ $loader: $loader, $engine: $engine }),
		null
	);
	
	rv.jsapi = new function() {
		this.script = function(name,code,scope) {
			return $engine.script(name, String(code), scope);
		}
	}
	
	rv.exit = function(status) {
		$engine.exit(status);
	}
	
	rv.jsh = function(configuration,invocation) {
		return $engine.jsh(configuration,invocation);
	}
	
	return rv;
})();

$engine.$javaloader = $javaloader;

