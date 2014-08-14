//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$jsh.setHost((function() {
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
})());
