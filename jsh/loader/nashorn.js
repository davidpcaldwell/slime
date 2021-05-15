//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

$jsh.setRuntime((function() {
	//	TODO	the below, with scripts and rv, looks funny; does it load the same code twice? Why? Should either fix or provide
	//			explanation

	var $graal = this.$graal;
	var scripts = (function($loader) {
		return eval($jsh.getLoader().getLoaderCode("jrunscript/nashorn.js"));
	})(void(0));

	var rv = scripts.script(
		"slime://loader/jrunscript/nashorn.js",
		$jsh.getLoader().getLoaderCode("jrunscript/nashorn.js"),
		{
			$graal: $graal,
			//	TODO	can the following come from Object.create()?
			Java: Java,
			Packages: Packages,
			load: load,
			$loader: $jsh.getLoader(),
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
			$nashorn.exit(status);
		}
	}

	//	TODO	NASHORN	Regression in 8u40 causes this extra variable to be necessary
	var NASHORN_IN_SCOPE_$jsh = $jsh;

	rv.jsh = function(configuration,invocation) {
		return scripts.subshell(function() {
			try {
				return Packages.inonit.script.jsh.Nashorn.execute(NASHORN_IN_SCOPE_$jsh.subshell(configuration,invocation));
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
}).call(this));