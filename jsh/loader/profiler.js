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

var _args = $host.getSystemProperties().get("inonit.tools.Profiler.args");
var options = {};
//	TODO	currently does not contemplate repeated options
for (var i=0; i<_args.length; i++) {
	var pair = String(_args[i]);
	var tokens = pair.split("=");
	options[tokens[0]] = tokens[1];
}
if (options.listener || options.output) {
	//	TODO	test for existence of this class as well?
	Packages.inonit.tools.Profiler.javaagent().addListener(new JavaAdapter(
		Packages.inonit.tools.Profiler.Listener,
		new function() {
			var Code = function(_peer) {
				if (_peer && _peer.getSourceName && _peer.getLineNumbers && _peer.getFunctionName) {
					this.sourceName = String(_peer.getSourceName());
					this.lineNumbers = jsh.java.toJsArray(_peer.getLineNumbers(), function(v) {
						return v;
					});
					if (_peer.getFunctionName()) {
						this.functionName = String(_peer.getFunctionName());
					}
				} else if (_peer && _peer.getClassName && _peer.getMethodName && _peer.getSignature) {
					this.className = String(_peer.getClassName());
					this.methodName = String(_peer.getMethodName());
					this.signature = String(_peer.getSignature());
				} else if (_peer && _peer.getClass && String(_peer.getClass().getName()) == "java.lang.String") {
					//	TODO	if we want to keep using this we should fix its idiosyncrasies, like the lack of all line numbers
					var parser = /^(.*) \[(.*)\-(.*)\](?: (.*)\(\))?$/.exec(String(_peer));
					if (!parser) throw new TypeError("No match for " + String(_peer));
					var tokens = String(_peer).split(" ");
					this.sourceName = parser[1];
					this.lineNumbers = [Number(parser[2]),Number(parser[3])];
					if (parser[4]) {
						this.functionName = parser[4];
					}
				} else if (_peer && _peer.getMetadata && _peer.getFunction) {
					var sourceName = String(_peer.getMetadata());
					var code = _peer.getFunction().toString().split("\n");
					var recompilableScriptFunctionDataPattern = /^(?:(.*) )?name\=\'(.*)\' (.*)$/;
					if (true && recompilableScriptFunctionDataPattern.test(sourceName)) {
						var match = recompilableScriptFunctionDataPattern.exec(sourceName);
						var metadata = (match[1]) ? match[1].split(":") : [];
						if (metadata.length) {
							this.sourceName = metadata.slice(0,metadata.length-1).join(":");
							var start = Number(metadata[metadata.length-1]);
							this.lineNumber = start;
						} else {
							this.sourceName = "<unknown>";
						}
						if (match[2] != "<anonymous>") {
							this.functionName = match[2];
						}
					} else {
						this.sourceName = String(_peer.getMetadata());
						this.lineNumbers = [];
					}
				} else {
					var debug = function(s) {};
					debug("_peer = " + _peer);
					if (_peer && typeof(_peer) == "object") {
						if (_peer.getClass) {
							debug("_peer class = " + _peer.getClass());
						} else {
							debug("_peer keys = " + Object.keys(_peer));
						}
					} else {
						debug("_peer type: " + typeof(_peer));
					}
				}
			}

			var Statistics = function(_peer) {
				this.count = _peer.getCount();
				this.elapsed = _peer.getElapsed();
			}

			var Node = function(_peer) {
				var Constructor = arguments.callee;

				this.code = new Code(_peer.getCode());
				this.statistics = new Statistics(_peer.getStatistics());
				this.children = jsh.java.toJsArray(_peer.getChildren(), function(_child) {
					return new Constructor(_child);
				});
			}

			var Timing = function(_peer) {
				this.root = new Node(_peer.getRoot());
			}

			var Profile = function(_peer) {
				this.thread = {
					name: String(_peer.getThread().getName())
				};

				this.timing = new Timing(_peer.getTiming());
			};

			this.onExit = function(_profiles) {
				var profiles = jsh.java.toJsArray(_profiles, function(_profile) {
					return new Profile(_profile);
				});

				if (options.listener) {
					var _listener = new Packages.java.io.File(options.listener);
					var pathname = jsh.file.filesystems.os.Pathname(String(_listener.getCanonicalPath()));
					jsh.loader.run(pathname, {
						$loader: new jsh.io.Loader({ _source: Packages.inonit.script.engine.Code.Source.create(_listener.getParentFile()) }),
						jsh: jsh,
						profiles: profiles
					});
				} else if (options.output && /\.html$/.test(options.output) && jsh.shell.jsh.home) {
					var pathname = jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer/module.js");
					//	TODO	the below would not work because when jsh.loader.module loads the module, it does not
					//			provide the module with a $loader which has been decorated with the jsh.io stuff
					//			(that is, the .resource() method). That's a bug and a redesign may be needed.
					//
					//			The good news is that we can now use the same scope strategy to send profiles (not
					//			putting it within $context).
					if (false) {
						jsh.loader.module(pathname, {
							profiles: profiles,
							to: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.output).getCanonicalPath()))
						});
					} else {
						jsh.shell.echo("Emitting profiling data to " + options.output + " ...", { stream: jsh.shell.stderr });
						jsh.loader.run(pathname, {
							$loader: new jsh.io.Loader({ _source: Packages.inonit.script.engine.Code.Source.create(pathname.parent.java.adapt()) }),
//							jsh: jsh,
							profiles: profiles,
							to: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.output).getCanonicalPath()))
						});
					}
				}
			}
		}
	));
}