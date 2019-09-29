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

		scope.$slime = $slime;

		(function setDeprecatedProperty(object,property,value) {
			object[property] = value;
			//	TODO	deprecating $jsh property breaks Nashorn somehow, apparently by making the global $jsh the one seen
			if (typeof(Packages.org.mozilla.javascript.Context.getCurrentContext) == "function" && Packages.org.mozilla.javascript.Context.getCurrentContext() != null) {
				$slime.$api.deprecate(object,property);
			}
		})(scope,"$jsh",$slime);

		scope.global = (p.mock && p.mock.global) ? p.mock.global : (function() { return this; })();
		scope.jsh = (p.mock && p.mock.jsh) ? p.mock.jsh : jsh;
		scope.$loader = p.$loader;
		scope.$loader.classpath = new function() {
			this.add = function(pathname) {
				$slime.classpath.add({ _file: pathname.java.adapt() });
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
					try {
						log(log.Level.WARNING, "Plugin from " + item + " is disabled: " + item.declaration.disabled());
					} catch (e) {
						//	TODO	default value for object?!?
						log(log.Level.WARNING, "Plugin is disabled: " + item.declaration.disabled());
					}
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

	var scan = function(loader,list) {
		if (!list) list = [];
		if (loader.get("plugin.jsh.js")) {
			list.push({
				loader: loader
			});
		} else {
			if (loader.list) {
				var listed = loader.list();
				for (var i=0; i<listed.length; i++) {
					if (listed[i].loader) {
						scan(listed[i].loader,list);
					} else if (/\.slime$/.test(listed[i].path)) {
						list.push({ slime: listed[i].resource });
					} else if (/\.jar$/.test(listed[i].path)) {
						list.push({ jar: listed[i].resource });
					} else {
						//	ignore other kinds of files, presumably
					}
				}
			}
		}
		return list;
	}

	this.load = function(p) {
		if (p._file && p._file.isDirectory()) {
			p.loader = new $slime.Loader({ _file: p._file })
		}
		var list = [];
		var plugins = {};
		if (p.loader) {
			var sources = scan(p.loader);
			sources.sort(function(a,b) {
				var precedence = function(item) {
					return 0;
				}

				return precedence(b) - precedence(a);
			});
			//	TODO	should this share with jsh loader?
			//	Use while loop because loop can add to the list; not sure how .forEach() works in that instance
			//	TODO	check the above
			var index = 0;
			while(index < sources.length) {
				var item = sources[index];
				if (item.loader) {
					$slime.classpath.add({ src: { loader: item.loader }});
					var array = load({
						plugins: plugins,
						toString: (function(item) {
							return function() {
								return item.loader.toString();
							};
						})(item),
						$loader: item.loader
					});
					list.push.apply(list,array);
				} else if (item.slime) {
					var subloader = new $slime.Loader({ zip: { resource: item.slime } });
					$slime.classpath.add({ slime: { loader: subloader } });
					//	TODO	.slime files cannot contain multiple plugin folders; we only look at the top level. Is this a good
					//			decision?
					if (subloader.get("plugin.jsh.js")) {
						sources.push({
							loader: subloader
						});
					}
				} else if (item.jar) {
					$slime.classpath.add({ jar: { resource: item.jar }});
				}
				index++;
			}
		} else if (p.zip && p.zip._file) {
			var name = String(p.zip._file.getName());
			if (/\.jar$/.test(name)) {
				$slime.classpath.add({ jar: { _file: p.zip._file }});
			} else if (/\.slime$/.test(name)) {
				throw new Error("Deal with .slime");
			} else {
				throw new Error("Deal with " + name);
			}
		}
		run(list);
	}
})());
