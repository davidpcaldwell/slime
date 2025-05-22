//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * Script invoked to set up Rhino profiler prior to executing `jsh` scripts, if the `inonit.tools.Profiler.args`
	 * system property is present.
	 *
	 * @param { slime.jrunscript.native.java.util.Properties } _properties
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { slime.jsh.Global } jsh
	 */
	function(_properties,Packages,JavaAdapter,jsh) {
		var _args = _properties.get("inonit.tools.Profiler.args");
		/** @type { slime.jrunscript.tools.profiler.rhino.Options } */
		var options = {
			listener: void(0),
			html: void(0),
			json: void(0),
			exclude: void(0)
		};
		//	TODO	currently does not contemplate repeated options
		for (var i=0; i<_args.length; i++) {
			var pair = String(_args[i]);
			var tokens = pair.split("=");
			options[tokens[0]] = tokens[1];
		}
		if (options.listener || (options.html || options.json)) {
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
							this.sourceName = parser[1];
							this.lineNumbers = [Number(parser[2]),Number(parser[3])];
							if (parser[4]) {
								this.functionName = parser[4];
							}
						} else if (_peer && _peer.getMetadata && _peer.getFunction) {
							var sourceName = String(_peer.getMetadata());
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

					/** @type { new (_peer: any) => slime.jrunscript.tools.profiler.rhino.Statistics } */
					var Statistics = function(_peer) {
						this.count = _peer.getCount();
						this.elapsed = _peer.getElapsed();
					}

					var Node = function recurse(_peer) {
						return {
							code: new Code(_peer.getCode()),
							statistics: new Statistics(_peer.getStatistics()),
							children: jsh.java.toJsArray(_peer.getChildren(), function(_child) {
								return recurse(_child);
							})
						}
					}

					var Timing = function(_peer) {
						this.root = Node(_peer.getRoot());
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
							jsh.loader.run(
								jsh.file.filesystems.os.Pathname(String(_listener.getCanonicalPath())),
								{
									$loader: new jsh.io.Loader({ _file: _listener.getParentFile() }),
									jsh: jsh,
									profiles: profiles
								}
							);
						} else if ( (options.html || options.json) && (jsh.shell.jsh.home || jsh.shell.jsh.src) ) {
							var pathname = (function() {
								//	The JSH_PROFILER_MODULE hack is to support the profiler suite.jsh.js program, but there is probably a
								//	better long-term design
								if (jsh.shell.environment.JSH_PROFILER_MODULE) return jsh.file.Pathname(jsh.shell.environment.JSH_PROFILER_MODULE);
								if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getRelativePath("tools/profiler/viewer/module.js");
								if (jsh.shell.jsh.src) return jsh.shell.jsh.src.getRelativePath("rhino/tools/profiler/viewer/module.js");
							})();
							//	TODO	the below would not work because when jsh.loader.module loads the module, it does not
							//			provide the module with a $loader which has been decorated with the jsh.io stuff
							//			(that is, the .resource() method). That's a bug and a redesign may be needed.
							//
							//			The good news is that we can now use the same scope strategy to send profiles (not
							//			putting it within $context).
							//
							//	TODO	the above comment is quite old and may be obsolete. .resource() does not exist anymore, for
							//			example.
							if (false) {
								jsh.loader.module(pathname, {
									profiles: profiles,
									to: {
										//jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.output).getCanonicalPath()))
									}
								});
							} else {
								if (options.html) jsh.shell.console("Emitting profiling UI to " + options.html + " ...");
								if (options.json) jsh.shell.console("Emitting profiling data to " + options.json + " ...");
								/** @type { slime.jrunscript.tools.profiler.rhino.viewer.Scope } */
								var scope = {
									$context: {
										profiles: profiles,
										console: jsh.shell.console,
										to: {
											//	TODO	the expansive expressions with os.Pathname seem unnecessary, aren't they
											//			literally just no-ops that wrap the options.html and options.json?
											html: (options.html) ? {
												location: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.html).getCanonicalPath())),
												inline: {
													css: true,
													json: true,
													js: true
												}
											} : void(0),
											json: (options.json) ? {
												location: jsh.file.filesystems.os.Pathname(String(new Packages.java.io.File(options.json).getCanonicalPath()))
											} : void(0)
										}
									},
									$loader: new jsh.io.Loader({ _file: pathname.parent.java.adapt() })
								};
								jsh.loader.run(pathname, scope);
							}
						}
					}
				}
			));
		}
	}
//@ts-ignore
)(_properties,Packages,JavaAdapter,jsh);
