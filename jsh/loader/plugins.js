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

(function(_plugins) {
	var plugins = {};
	var readPlugin = function(_code,callbacks) {
		if (_code.getScripts()) {
			var scope = {};
			//	TODO	$host is currently *automatically* in scope for these plugins, but that is probably not as it should be; see
			//			issue 32. $host *should* be in scope, though; we should just have to put it there manually.
			scope.plugins = plugins;
			scope.plugin = function(declaration) {
				if (typeof(declaration.isReady) == "undefined") {
					declaration.isReady = function() {
						return true;
					};
				}
				callbacks.script({ _code: _code, declaration: declaration });
			}
			scope.$jsh = $host;
			scope.global = (function() { return this; })();
			scope.jsh = jsh;

			var $loader = new $host.Loader({ _code: _code });
			scope.$loader = new (function($loader) {
//				this.file = function(path,context) {
//					return loader.plugin.file(_code,path,context);
//				};
//				this.module = function(path,context) {
//					return loader.plugin.module(_code,path,context);
//				};
//				this.run = function(path,scope,target) {
//					return loader.plugin.run(_code,path,scope,target);
//				};
//				this._stream = function(path,scope,target) {
//					return loader.plugin._stream(_code,path,scope,target);
//				};
				$loader.classpath = new function() {
					this.add = function(pathname) {
						return loader.classpath.add(pathname.java.adapt());
					}
				}
				return $loader;
			})($loader);
			loader.plugin.read(_code,scope);
		} else {
			callbacks.java({ _code: _code });
		}
	};

	var list = [];
	for (var i=0; i<_plugins.length; i++) {
		Packages.inonit.system.Logging.get().log(
			$host.java.getNamedJavaClass("inonit.script.jsh.Shell"),
			Packages.java.util.logging.Level.FINE,
			"Reading plugins from " + _plugins[i].getCode()
		);
		var _code = _plugins[i].getCode();
		readPlugin(_code,{
			script: function(v) {
				list.push(v);
			},
			java: function(v) {
				loader.plugin.addClasses(v._code);
			}
		});
	}

	var stop = false;
	while(list.length > 0 && !stop) {
		var marked = false;
		var i = 0;
		//	TODO	should isReady be optional?
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
				var message = (item.declaration.disabled) ? item.declaration.disabled() : "never returned true from isReady(): " + item.declaration.isReady;
				Packages.inonit.system.Logging.get().log(
					$host.java.getNamedJavaClass("inonit.script.jsh.Shell"),
					Packages.java.util.logging.Level.WARNING,
					"Plugin from " + item._code.getScripts() + " is disabled: " + message
				);
			});
		}
	}
})