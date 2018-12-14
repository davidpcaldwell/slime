//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader for web browsers.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

window.callbacks.push(function() {
	html.initialize();
	if (parameters) {
		if (!parameters.jsapi) {
			parameters.jsapi = document.getElementById("jsapi").value;
		}
		if (!parameters.platform) {
			parameters.platform = document.getElementById("platform").value;
		}
		html.setModules(parameters.module);
		document.getElementById("jsapi").value = parameters.jsapi;
		document.getElementById("platform").value = parameters.platform;
		document.getElementById("modes.module").value = parameters["modes.module"];
		document.getElementById("modes.execute").value = parameters["modes.execute"];
		if (parameters.nocatch) {
			document.getElementById("nocatch").checked = true;
		} else {
			document.getElementById("nocatch").checked = false;
		}
		if (parameters.asynchronous) {
			document.getElementById("asynchronous").checked = true;
		} else {
			document.getElementById("asynchronous").checked = false;
		}
	} else {
		document.getElementById("results").style.display = "none";
		document.getElementById("debug").style.display = "none";
	}
	if (parameters) {
		var loaders = {};
		loaders.jsapi = new inonit.loader.Loader(inonit.loader.nugget.page.base+parameters.jsapi);
		log.flush();
		var jsapi = loaders.jsapi.file("unit.js", {
			api: {
				Promise: (function(constant) {
					return function() {
						return constant;
					};
				})(window.Promise)
			},
			asynchronous: {
				scenario: function(next) {
					window.setTimeout(next,1);
				}
				,test: function(next) {
					window.setTimeout(next,1);
				}
			}
		});
		var browser = inonit.loader.loader.module("module.js", {
			api: {
				unit: jsapi,
				Promise: window.Promise
			}
		});
//		//	TODO	may not be right place for this
//		inonit.loader.run(inonit.loader.nugget.page.base+"initialize.js");
		var Console = loaders.jsapi.file("console.js").Forwarder;
		var apiHtmlScript = loaders.jsapi.file("api.html.js", {
			api: {
				Promise: window.Promise
			}
		});
		var HALT_ON_EXCEPTION = Boolean(parameters.nocatch);

		var toErrorMessage = function(e) {
			if (e.message) return e.message + " at line " + e.lineNumber + " in " + e.fileName;
			if (typeof(e) == "string") return e;
			return "Unknown error type: " + e;
		}

		var dumpError = function(error,log) {
			if (!log) log = function(){};
			log("Error: " + error);
			if (error.stack) {
				if (error.code) {
					var lines = error.stack.split("\n");
					if (lines[1].substring(0,"    at ".length) == "    at ") {
						var evalFormat = /\(eval at (?:.*), (\S+)\:(\d+)\:(\d+)\)/;
						var match = evalFormat.exec(lines[1]);
						if (match) {
							var lineNumber = match[2];
							var columnNumber = match[3];
							var script = error.code.split("\n");
							var prefix = "";
							for (var i=0; i<columnNumber-1; i++) {
								if (script[lineNumber-1].substring(i,i+1) == "\t") {
									prefix += "\t";
								} else {
									prefix += " ";
								}
							}
							script.splice(Number(match[2]),0,prefix + "^",prefix + error.name + ": " + error.message);
							if (window.console && window.console.log) {
								window.console.log(script.join("\n"));
							}
							return;
						}
					}
					if (window.console && window.console.log) {
						window.console.log(error.code);
					}
					log(error.code);
				}
				if (window.console && window.console.log) {
					window.console.log(error.stack);
				}
				log(error.stack);
			}
			if (error.cause) {
				error.cause.code = error.code;
				arguments.callee(error.cause,log);
			}
		}

		var scenarios = [];
		for (var i=0; i<parameters.module.length; i++) {
			var test = (function() {
				var string = parameters.module[i];
				if (string.indexOf(":") == -1) {
					return { module: string };
				} else {
					var tokens = string.split(":");
					return { module: tokens[0], path: tokens[1] };
				}
			})();
			var module = test.module;
			var location = (function() {
				if (module.substring(module.length-1) == "/") {
					return {
						base: module,
						path: module
					};
				} else {
					return {
						base: module.split("/").slice(0,-1).join("/") + "/",
						main: module.split("/").slice(-1),
						path: module
					};
				}
			})();
			var documentation = (function() {
				if (!location.main) return location.base + "api.html";
				var jsName = /(.*)\.js$/.exec(location.main);
				if (jsName) {
					return location.base + jsName[1] + ".api.html";
				} else {
					//	untested
					return location.base + location.main + ".api.html";
				}
			})();

			(function() {
				var Scope = function(base) {
					var self = this;
					var Self = arguments.callee;

					//	TODO	obsolete?
					this.top = "";

					this.$relative = function(getRelativePath) {
						//	TODO	since this ignores getRelativePath, it almost certainly does not work
						return new Self(base + this.top);
					};

					this.$jsapi = new function() {
						this.api = {
							browser: browser,
							unit: jsapi
						};

						this.loader = new function() {
							this.module = function(path,context) {
								//	TODO	probable bug here; probably works when module path ends in /, but for module path
								//			that has a terminal file name, probably needs to strip that file name to find the
								//			base from which to load the module at 'path'
								return inonit.loader.module(
									inonit.loader.nugget.page.relative(base+path),
									context
								);
							};
							this.file = function(path,context) {
								return inonit.loader.file(
									inonit.loader.nugget.page.relative(base+path),
									context
								);
							};
							this.run = function(path,scope,target) {
								return inonit.loader.run(
									inonit.loader.nugget.page.relative(base+path),
									scope,
									target
								);
							}
							//	TODO	can the below eval and string be replaced by a form of loader.get() or something?
							this.eval = function(path,scope) {
								if (!scope) scope = {};
								with(scope) {
									return eval(inonit.loader.Loader.getCode(base + self.top + path));
								}
							};
							this.string = function(path) {
								return inonit.loader.Loader.getCode(base + self.top + path);
							};
							this.coffee = window.CoffeeScript;

							//	TODO	add this.scenario; see jsh/unit/jsapi.js
						};

						this.environment = {};
					};

					this.$platform = inonit.loader.$sdk.platform;
					this.$api = inonit.loader.$sdk.api;
				}

				var extracted = inonit.loader.loader.file("api.js", {
					api: {
						browser: browser,
						jsapi: jsapi
					}
				});
				var getLoaderApiDom = extracted.getLoaderApiDom;

				var loaderApiDom = getLoaderApiDom(documentation);
				var apiHtml = new apiHtmlScript.ApiHtmlTests(loaderApiDom,module);
				var base = (function() {
					var tokens = module.split("/");
					if (tokens[tokens.length-1].length == 0) return tokens.join("/");
					return tokens.slice(0,tokens.length-1).join("/") + "/";
				})();
				var scope = new extracted.Scope(base);
				for (var x in parameters) {
					var pattern = /^environment\.(.*)/;
					var match = pattern.exec(x);;
					if (match) {
						var tokens = match[1].split(".");
						var target = scope.$jsapi.environment;
						for (var i=0; i<tokens.length; i++) {
							if (i < tokens.length-1) {
								target[tokens[i]] = {};
								target = target[tokens[i]];
							} else {
								target[tokens[i]] = parameters[x];
							}
						}
					}
				}
				scope.top = (function() {
					//	TODO	it could be that this jsapi:top capability is obsolete, and therefore the $dom member
					//			of DOM is obsolete; possibly this was used before relative paths were used to find
					//			modules being loaded. This would also obsolete the 'top' attribute of scope, which means
					//			Scope would be modified above.
					var find = function(element) {
						var recurse = arguments.callee;
						if (element.tagName && element.tagName.toLowerCase() == "jsapi:top") return element;
						//	IE
						if (element.tagName && element.tagName.toLowerCase() == "top" && element.tagUrn == "http://www.inonit.com/jsapi") return element;
						for (var i=0; i<element.childNodes.length; i++) {
							if (recurse(element.childNodes[i])) {
								return element.childNodes[i];
							}
						}
					};

					var declaration = find(loaderApiDom.$dom.root);
					if (declaration) return declaration.getAttribute("path");
					return "";
				})();
				var moduleScenario = apiHtml.getSuiteDescriptor(scope,test.path);
				moduleScenario.name = (test.path) ? (module + ":" + test.path) : module;
				scenarios.push(moduleScenario);
			})();
		}

		var scenario = new jsapi.Suite({ old: true });
		for (var i=0; i<scenarios.length; i++) {
			scenario.part(String(i+1),scenarios[i]);
//					scenario.add({ scenario: scenarios[i] });
		}
//				var _scenario = {};
//				_scenario.name = "Unit Tests";
//				_scenario.execute = function(scope) {
//					for (var i=0; i<scenarios.length; i++) {
//						scope.scenario(scenarios[i]);
//					}
//				}
//				var scenario = new jsapi.Scenario(_scenario);
		var events = [];
		//	TODO	merge into framework somewhere? Need to generalize more (does it buffer all events; is the array
		//			mutable to callers, and so forth
		var poster = new function() {
			var push = function(e) {
				events.push(e);
			};
			scenario.listeners.add("scenario", push);
			scenario.listeners.add("test", push);
		};
		var console = new function() {
			var log = function(message) {
				var child = document.createElement("div");
				child.appendChild(document.createTextNode(message));
				document.getElementById("log").appendChild( child );
			}

			var current = document.getElementById("tree");

			this.start = function(scenario) {
				log("Running: " + scenario.name);
				var now = document.createElement("div");
				now.scenario = scenario;
				now.appendChild(document.createTextNode("Running: " + scenario.name));
				current.appendChild(now);
				current = now;
			}

			this.end = function(scenario, success) {
				var result = (success) ? "Passed" : "Failed";
				current.appendChild(document.createTextNode(result + " " + scenario.name))
				current = current.parentNode;
				log("END Scenario: " + scenario.name);
			};

			this.test = function(test) {
				if (test.success) {
					log("Success: " + test + "; " + test.message);
				} else {
					log("Failure: " + test);
					log("Reason: " + test.message);
				}
				if (test.error) {
					dumpError(test.error,log);
				}
				var div = document.createElement("div");
				div.appendChild(document.createTextNode(test.message));
				current.appendChild(div);
			}

			this.send = function() {
				events.push({ close: true });
				var req = new window.XMLHttpRequest();
				req.open("POST", "console", false);
				req.send(JSON.stringify(events));
			}
		};
		new jsapi.View(console).listen(scenario);
		//	TODO	remove this, and then UI element and conditionals using it, when it is shown to be stable (added 2017 Sep 27)
		var ASYNCHRONOUS = true;

		var onResult = (function() {
			if (window.opener
				&& window.opener.inonit
				&& window.opener.inonit.dom
				&& window.opener.inonit.dom.window
				&& window.opener.inonit.dom.window.open
				&& window.opener.inonit.dom.window.open.context
				&& window.opener.inonit.dom.window.open.context.get(window)
				&& window.opener.inonit.dom.window.open.context.get(window).onTestResult
			) {
				return function(success) {
					window.opener.inonit.dom.window.open.context.get(window).onTestResult(success);
				};
			} else if (parameters.callback == "server") {
				return function(success) {
					console.send();
					var req = new window.XMLHttpRequest();
					req.open("POST", "success", false);
					req.send(success);
					//	We do not really care about response code
				};
			} else {
				return function(success) {
					if (!success) {
						alert("Failed!");
					} else {
						alert("PASS");
					}
				};
			}
		})();
		var run = {
			console: console,
			haltOnException: HALT_ON_EXCEPTION
			//,
			//callback: (ASYNCHRONOUS) ? function(success) { onResult(success) } : void(0)
		};
		if (ASYNCHRONOUS) {
			scenario.promise(run).then(function(result) {
				onResult(result);
			});
		} else {
			var result = scenario.run(run);
			if (!ASYNCHRONOUS) {
				onResult(result);
			}
		}
	}
});