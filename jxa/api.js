//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { any } $
	 * @param { any } Application
	 * @param { any } Ref
	 */
	function($,Application,Ref) {
		var objc = new function() {
			this.dictionary = new function() {
				this.adapt = function($o) {
					/** @type { { [name: string]: string } } */
					var rv = {};
					for (var x in $o.js) {
						rv[x] = $o.js[x].js;
					}
					return rv;
				}
			};

			this.array = new function() {
				this.adapt = function($a) {
					var rv = [];
					for (var i=0; i<$a.count; i++) {
						rv[i] = $a.objectAtIndex(i).js;
					}
					return rv;
				}
			};

			var filesystem = new function() {
				var $mgr = $.NSFileManager.defaultManager;

				this.directory = function(string) {
					var isDirectoryOut = Ref();
					$mgr.fileExistsAtPathIsDirectory(string,isDirectoryOut);
					return isDirectoryOut[0];
				}
			};

			this.filesystem = filesystem;
		};

		var environment = objc.dictionary.adapt($.NSProcessInfo.processInfo.environment);

		if (environment.SLIME_JXA_DEBUG) debugger;

		var bootstrap = Application.currentApplication()
		bootstrap.includeStandardAdditions = true
		var bootstrapPath = bootstrap.pathTo(this)

		var system = Application("System Events")

		function load(path) {
			//console.log("loading " + path);
			var handle = bootstrap.openForAccess(path);
			var contents = bootstrap.read(handle);
			bootstrap.closeAccess(handle);
			return {
				code: contents.toString()
			};
		}

		var invocation = (function processArguments(argv) {
			var osascript = argv.shift();
			var language = [argv.shift(), argv.shift()];
			var me = [argv.shift()];
			var script = argv.shift();
			return {
				bootstrap: me[0],
				script: script,
				arguments: argv
			}
		})(objc.array.adapt($.NSProcessInfo.processInfo.arguments));

		var slimePath = (function() {
			if (invocation.bootstrap.substring(0,1) != "/") {
				invocation.bootstrap = environment.PWD + "/" + invocation.bootstrap;
			}
			var tokenized = invocation.bootstrap.split("/");
			var directory = tokenized.slice(0,-2).join("/") + "/";
			//	TODO	should we remove . and .. from the path? Seems to work anyway.
			return directory;
		})();

		//  TODO    build Loader implementation on top of this
		var runtime = (function(slime) {
			/** @type { slime.runtime.Scope } */
			var scope = {
				$slime: {
					getRuntimeScript: function(path) {
						return {
							name: path,
							js: load(slime+"loader/" + path).code
						}
					},
					configuration: {}
				},
				$engine: void(0)
			}
			return eval(load(slime+"loader/expression.js").code);
		})(slimePath + "/");

		var main = (function(script,pwd) {
			if (script.substring(0,1) == "/") {
				return script;
			} else {
				return pwd + "/" + script;
			}
		})(invocation.script,environment.PWD);

		var Pathname = function(o) {
			//	TODO	would be nice to canonicalize the value of o.string

			this.directory = void(0);
			Object.defineProperty(this, "directory", {
				get: function() {
					if (objc.filesystem.directory(o.string)) return new Directory({ pathname: this });
					return null;
				}
			});

			this.toString = function() {
				return o.string;
			}
		}

		var Directory = function(o) {
			this.toString = function() {
				return o.pathname.toString();
			};

			this.pathname = o.pathname;
		};

		var File = function(o) {
		};

		var Loader = function(o) {
			return new runtime.Loader({
				get: function(path) {
					var directoryPath = o.directory.pathname.toString();
					var target = directoryPath + path;
					var script = load(target);
					return {
						read: {
							string: function() { return script.code; }
						}
					}
				}
			});
		}

		/**
		 * @type { slime.jxa.Global }
		 */
		var rv = {};

		rv.delay = (function(seconds) {
			this.delay(seconds);
		}).bind(this);

		rv.Application = function(name) {
			return Application(name);
		};

		rv.system = {
			processes: {
				byName: function(name) {
					return system.processes.byName(name);
				}
			}
		};

		rv.shell = {
			echo: function(s) {
				console.log(s);
			},
			environment: environment
		};

		rv.script = new function() {
			this.arguments = invocation.arguments;

			this.loader = (function() {
				var dirname = main.split("/").slice(0,-1).join("/") + "/";
				var location = new Pathname({ string: dirname });
				var directory = location.directory;
				var loader = Loader({ directory: directory });
				return loader;
			})();
		};

		this.jxa = rv;

		var script = load(main);
		eval(script.code);
	}
//@ts-ignore
).call(this, $, Application, Ref);
