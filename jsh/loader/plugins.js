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
//	var $plugin = new function() {
//		this.read = function(loader,scope) {
//			//var loader = new $host.Loader({ _source: _code.getScripts() });
//			return loader.run("plugin.jsh.js", scope);
//		};
//		this.run = function(_code,path,scope,target) {
//			$host.run(
//				{
//					_source: _code.getScripts(),
//					path: path
//				},
//				scope,
//				target
//			);
//		};
//		this.file = function(_code,path,context) {
//			return $host.file(
//				{
//					_source: _code.getScripts(),
//					path: path
//				},
//				context
//			);
//		};
//		this.module = function(_code,main,context) {
//			var loader = new $host.Loader({ _code: _code });
//			return loader.module(main, context);
//		};
//		this._stream = function(_code,path) {
//			var _codeSourceFile = _code.getScripts().getFile(path);
//			if (_codeSourceFile) return _codeSourceFile.getInputStream();
//			return null;
//		};
//		this.addClasses = function(_code) {
//			$host.classpath.add(_code.getClasses());
//		}
//	};

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
				if (typeof(declaration.disabled) == "undefined") {
					declaration.disabled = function() {
						return "never returned true from isReady(): " + declaration.isReady;
					}
				}
				callbacks.script({ 
					toString: function() {
						return String(_code.getScripts()).replace(/\%/g, "%%");
					}, 
					declaration: declaration 
				});
			}
			scope.$jsh = $host;
			scope.global = (function() { return this; })();
			scope.jsh = jsh;

			scope.$loader = new $host.Loader({ _code: _code });
			scope.$loader.classpath = new function() {
				this.add = function(pathname) {
					return loader.classpath.add(pathname.java.adapt());
				}
			};
			scope.$loader.run("plugin.jsh.js", scope);
		} else {
			callbacks.java({ _code: _code });
		}
	};

	var list = [];
	for (var i=0; i<_plugins.length; i++) {
		Packages.inonit.system.Logging.get().log(
			$host.java.getNamedJavaClass("inonit.script.jsh.Shell"),
			Packages.java.util.logging.Level.FINE,
			"Reading plugins from " + _plugins[i]
		);
		var _code = _plugins[i];
		readPlugin(_code,{
			script: function(v) {
				list.push(v);
			},
			java: function(v) {
				$host.classpath.add(v._code.getClasses())
//				$plugin.addClasses(v._code);
			}
		});
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
})