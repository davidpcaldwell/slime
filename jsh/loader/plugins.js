//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

new (function() {
	var load = function(p) {
		var scope = {};
		//	TODO	$host is currently *automatically* in scope for these plugins, but that is probably not as it should be; see
		//			issue 32. $host *should* be in scope, though; we should just have to put it there manually.
		scope.plugins = p.plugins;
		var rv = [];
		scope.plugin = function(declaration) {
			if (typeof(declaration.isReady) == "undefined") {
				declaration.isReady = function() {
					return true;
				};
			}
			if (typeof(declaration.disabled) == "undefined") {
				declaration.disabled = function() {
					return "never returned true from isReady(): " + declaration.isReady;
				}
			}
			rv.push({
				toString: p.toString,
				declaration: declaration
			});
		}
		scope.$jsh = $host;
		scope.global = (function() { return this; })();
		scope.jsh = jsh;
		scope.$loader = p.$loader;
		scope.$loader.classpath = new function() {
			this.add = function(pathname) {
				return loader.classpath.add(pathname.java.adapt());
			}
		};
		scope.$loader.run("plugin.jsh.js", scope);
		return rv;
	}
	
	this._load = function(_plugins) {
		var plugins = {};
//		var readPlugin = function(_code,callbacks) {
//			if (_code.getScripts()) {
//				load({
//					plugins: plugins,
//					toString: function() {
//						return String(_code.getScripts()).replace(/\%/g, "%%");						
//					},
//					$loader: new $host.Loader({ _code: _code }),
//					callbacks: callbacks
//				});
//			} else {
//				callbacks.java({ _code: _code });
//			}
//		};

		var list = [];
		for (var i=0; i<_plugins.length; i++) {
			Packages.inonit.system.Logging.get().log(
				$host.java.getNamedJavaClass("inonit.script.jsh.Shell"),
				Packages.java.util.logging.Level.FINE,
				"Reading plugins from " + _plugins[i]
			);
//			var callbacks = {
//				script: function(v) {
//					list.push(v);
//				},
//				java: function(v) {
//					$host.classpath.add(v._code.getClasses())
//	//				$plugin.addClasses(v._code);
//				}
//			};
			var toString = function(_plugin) {
				return function() {
					return String(_plugin.getScripts()).replace(/\%/g, "%%")
				};
			};
			if (_plugins[i].getScripts()) {
				var array = load({
					plugins: plugins,
					toString: toString(_plugins[i]),
					$loader: new $host.Loader({ _code: _plugins[i] })
				});
				list.push.apply(list,array);
			} else {
				$host.classpath.add(_plugins[i].getClasses());
//				callbacks.java({ _code: _plugins[i] });
			}
		}

		var stop = false;
		while(list.length > 0 && !stop) {
			var marked = false;
			var i = 0;
			while(i < list.length && !marked) {
				if (list[i].declaration.isReady()) {
					list[i].declaration.load();
					list.splice(i,1);
					marked = true;
				}
				i++;
			}
			if (list.length > 0 && !marked) {
				//	Some plugin was never ready
				stop = true;
				//	TODO	think harder about what to do
				list.forEach(function(item) {
					Packages.inonit.system.Logging.get().log(
						$host.java.getNamedJavaClass("inonit.script.jsh.Shell"),
						Packages.java.util.logging.Level.WARNING,
						"Plugin from " + item + " is disabled: " + item.declaration.disabled()
					);
				});
			}
		}
	}
})()
