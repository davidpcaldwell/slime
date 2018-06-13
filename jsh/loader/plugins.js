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

$set(new (function() {
	//	Loads the plugin code from a specific plugin.jsh.js at the top level of a loader and returns a list of implementations
	//	with 'declaration' properties representing the objects provided by the implementor and 'toString' methods supplied by the
	//	caller of this function
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
		//	TODO	rename this to $slime, for consistency?
		scope.$slime = $slime;
		scope.$jsh = $slime;
		//	TODO	deprecating $jsh property breaks Nashorn somehow, apparently by making the global $jsh the one seen
		if (typeof(Packages.org.mozilla.javascript.Context.getCurrentContext) == "function" && Packages.org.mozilla.javascript.Context.getCurrentContext() != null) {
			$slime.$api.deprecate(scope,"$jsh");
		}
		scope.global = (function() { return this; })();
		scope.jsh = (p.mock && p.mock.jsh) ? p.mock.jsh : jsh;
		scope.$loader = p.$loader;
		scope.$loader.classpath = new function() {
			this.add = function(pathname) {
				return loader.classpath.add(pathname.java.adapt());
			}
		};
		scope.$loader.run("plugin.jsh.js", scope);
		return rv;
	};

	var log = function(_level,message) {
		//	TODO	improve with parameters, but then would need to create Java arrays and so forth
		Packages.java.util.logging.Logger.getLogger("inonit.script.jsh.Shell").log(
			_level,
			message
		);
	};
	log.Level = Packages.java.util.logging.Level;

	//	Given an array of plugin objects returned by load(), run all of those that are ready until all have been run or are not
	//	ready
	var run = function(plugins) {
		var stop = false;
		while(plugins.length > 0 && !stop) {
			var marked = false;
			var i = 0;
			while(i < plugins.length && !marked) {
				if (plugins[i].declaration.isReady()) {
					plugins[i].declaration.load();
					plugins.splice(i,1);
					marked = true;
				}
				i++;
			}
			if (plugins.length > 0 && !marked) {
				//	Some plugin was never ready
				stop = true;
				//	TODO	think harder about what to do
				plugins.forEach(function(item) {
					log(log.Level.WARNING, "Plugin from " + item + " is disabled: " + item.declaration.disabled());
				});
			}
		}
	};
	
	this.mock = function(p) {
		var list = load({
			plugins: (p.plugins) ? p.plugins : {},
			toString: (p.toString) ? p.toString : function() { return "mock"; },
			$loader: p.$loader,
			mock: {
				jsh: p.jsh
			}
		});
		run(list);
	};

	this._load = function(_plugins) {
		var plugins = {};

		var list = [];
		for (var i=0; i<_plugins.length; i++) {
			log(log.Level.FINE, "Reading plugins from " + _plugins[i]);
			var toString = function(_plugin) {
				return function() {
					return String(_plugin.getScripts()).replace(/\%/g, "%%")
				};
			};
			//	This is a bit counterintuitive: $slime.Loader *automatically* adds classes to the classpath; if we don't end up
			//	loading the plugin, we need to explicitly add the classes to the classpath
			//	TODO	clean this up, but would require test coverage
			if (_plugins[i].getScripts()) {
				var array = load({
					plugins: plugins,
					toString: toString(_plugins[i]),
					$loader: new $slime.Loader({ _code: _plugins[i] })
				});
				list.push.apply(list,array);
			} else {
				$slime.classpath.add(_plugins[i].getClasses());
			}
		}

		run(list);
	};

	var scan = function(loader,list) {
		if (!list) list = [];
		if (loader.get("plugin.jsh.js")) {
			list.push({
				loader: loader
			});
//			list.push.apply(list, load({
//				plugins: plugins,
//				toString: function() {
//					return loader.toString();
//				},
//				$loader: loader
//			}));
		} else {
			if (loader.list) {
				var listed = loader.list();
				for (var i=0; i<listed.length; i++) {
					if (listed[i].loader) {
						scan(listed[i].loader,list);
					} else if (/\.slime$/.test(listed[i].path)) {
						if (!listed[i]._file) throw new Error("No _file!");
						list.push({ slime: listed[i] });
					} else if (/\.jar$/.test(listed[i].path)) {
						list.push({ jar: listed[i] });
					} else {
						//	ignore other kinds of files, presumably
					}
				}
			}
		}
		return list;
	}

	this.load = function(loader) {
		var sources = scan(loader);
		sources.sort(function(a,b) {
			var precedence = function(item) {
				return 0;
			}
			
			return precedence(b) - precedence(a);
		});
		//	TODO	should this share with jsh loader?
		var plugins = {};
		var list = [];
		sources.forEach(function(item) {
			if (item.loader) {
				$slime.classpath.addUnpacked(item.loader);
				var array = load({
					plugins: plugins,
					toString: item.loader.toString(),
					$loader: item.loader
				});
				list.push.apply(list,array);
			} else if (item.slime) {
				var _scripts = $slime.classpath.addSlime(item.slime);
				var subloader = new $slime.Loader({ _source: _scripts });
				//	TODO	.slime files cannot contain multiple plugin folders; we only look at the top level. Is this a good
				//			decision?
				if (subloader.get("plugin.jsh.js")) {
					list.push({
						loader: subloader
					});
				}
			} else if (item.jar) {
				throw new Error("Not implemented: .jar");
			}
		});
		run(list);
//		run(scan(loader));
	}
})());
