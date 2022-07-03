//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { any } JavaAdapter
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.internal.run.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.internal.run.Exports> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$export) {
		/** @returns { slime.jrunscript.shell.internal.run.OutputDestination } */
		var getStringBufferDestination = function() {
			var buffer = new $context.api.io.Buffer();
			return {
				stream: buffer.writeBinary(),
				close: function() {
					buffer.close();
				},
				readText: function() {
					return buffer.readText().asString();
				}
			}
		};

		/**
		 * @param { string } stream
		 * @returns { "stdout" | "stderr" }
		 */
		var toStreamEventType = function(stream) {
			if (stream == "output") return "stdout";
			if (stream == "error") return "stderr";
		};

		/**
		 * @param { slime.$api.Events<slime.jrunscript.shell.run.TellEvents> } events
		 * @param { "output" | "error" } stream
		 * @returns { slime.jrunscript.shell.internal.run.OutputDestination }
		 */
		var getLineBufferDestination = function(events,stream) {
			var buffer = new $context.api.io.Buffer();

			var lines = [];

			var thread = $context.api.java.Thread.start({
				call: function() {
					buffer.readText().readLines(function(line) {
						lines.push(line);
						events.fire(toStreamEventType(stream), { line: line });
					});
				}
			});

			return {
				stream: buffer.writeBinary(),
				close: function() {
					buffer.close();
					thread.join();
				},
				readText: function() {
					return lines.join($context.api.io.system.delimiter.line);
				}
			}
		};

		/**
		 *
		 * @param { slime.jrunscript.runtime.io.OutputStream } stream
		 * @returns { slime.jrunscript.shell.internal.run.OutputDestination }
		 */
		var getRawDestination = function(stream) {
			return {
				stream: stream,
				close: function() {
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.run.StdioConfiguration } p
		 * @returns { (events: slime.$api.Events<slime.jrunscript.shell.run.TellEvents>) => slime.jrunscript.shell.internal.run.Stdio }
		 */
		function buildStdio(p) {
			/** @type { slime.jrunscript.shell.internal.run.Stdio } */
			var rv = {};
			/** @type { { [x: string]: slime.jrunscript.shell.internal.run.OutputDestination } } */
			var destinations = {};

			rv.input = p.input;

			/**
			 * @returns { { output?: string, error?: string } }
			 */
			rv.close = function() {
				/** @type { { output?: string, error?: string } } */
				var rv;
				for (var x in destinations) {
					destinations[x].close();

					if ((x == "output" || x == "error") && destinations[x] && destinations[x].readText) {
						if (!rv) rv = {};
						rv[x] = destinations[x].readText();
					}
				}
				return rv;
			};

			/**
			 *
			 * @param { slime.$api.Events<slime.jrunscript.shell.run.TellEvents> } events
			 * @param { "output" | "error" } stream
			 */
			var destinationFactory = function(events, stream) {
				/**
				 * @param { slime.jrunscript.shell.run.OutputCapture } configuration
				 * @returns { slime.jrunscript.shell.internal.run.OutputDestination }
				 */
				var getDestination = function(configuration) {
					if (configuration == "string") {
						return getStringBufferDestination();
					} else if (configuration == "line") {
						var destination = getLineBufferDestination(events, stream);
						// var handler = function(e) {
						// 	configuration.line(e.detail.line);
						// };
						// events.listeners.add(toStreamEventType(stream), handler);
						// destination.close = (function(was) {
						// 	return function() {
						// 		var rv = was.apply(this,arguments);
						// 		events.listeners.remove(toStreamEventType(stream), handler);
						// 		return rv;
						// 	}
						// })(destination.close);
						return destination;
					} else if (true) {
						return getRawDestination(configuration);
					}
				};

				return getDestination;
			};

			/** @type { ReturnType<buildStdio>}  */
			var returned = function(events) {
				["output","error"].forEach(
					/** @param { "output" | "error" } stream */
					function(stream) {
						var toDestination = destinationFactory(events, stream);
						destinations[stream] = toDestination(p[stream]);
						rv[stream] = destinations[stream].stream;
					}
				);

				return rv;
			};

			return returned;
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.run.java.Context } context
		 * @returns
		 */
		var createJavaCommandContext = function(context) {
			var _environment = (function(environment) {
				var _hashMap = function(p) {
					var rv = new Packages.java.util.HashMap();
					for (var x in p) {
						if (p[x] === null) {
							//	do nothing
						} else {
							rv.put( new Packages.java.lang.String(String(x)), new Packages.java.lang.String(String(p[x])) );
						}
					}
					return rv;
				}

				return _hashMap( environment );
			})(context.environment);
			return new JavaAdapter(
				Packages.inonit.system.Command.Context,
				{
					toString: function() {
						return JSON.stringify({
							environment: context.environment
						});
					},
					getStandardOutput: $api.Function.returning( (context.stdio.output) ? context.stdio.output.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM ),
					getStandardError: $api.Function.returning( (context.stdio.error) ? context.stdio.error.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM ),
					getStandardInput: $api.Function.returning( (context.stdio.input) ? context.stdio.input.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM ),
					getSubprocessEnvironment: $api.Function.returning( _environment ),
					getWorkingDirectory: $api.Function.returning((context.directory) ? context.directory.pathname.java.adapt() : null)
				}
			);
		};

		/**
		 * @param { slime.jrunscript.shell.internal.run.java.Configuration } configuration
		 */
		var createJavaCommandConfiguration = function(configuration) {
			var toJavaString = function(p) { return new Packages.java.lang.String(p); };

			var adapted = {
				command: toJavaString(configuration.command),
				arguments: $context.api.java.Array.create({
					type: Packages.java.lang.String,
					array: configuration.arguments.map(toJavaString)
				})
			}

			return new JavaAdapter(
				Packages.inonit.system.Command.Configuration,
				new function() {
					this.toString = function() {
						return "command: " + configuration.command + " arguments: " + configuration.arguments;
					};

					this.getCommand = $api.Function.returning(adapted.command);
					this.getArguments = $api.Function.returning(adapted.arguments);
				}
			);
		};

		/** @type { slime.jrunscript.shell.run.World } */
		var realWorld = {
			start: function(p) {
				var context = p.context;
				var configuration = p.configuration;
				var events = p.events;

				var stdio = buildStdio(context.stdio)(events);

				//	TODO	could throw exception on launch; should deal with it
				var _subprocess = Packages.inonit.system.OperatingSystem.get().start(
					createJavaCommandContext({
						directory: (typeof(context.directory) == "string") ? $context.api.file.Pathname(context.directory).directory : context.directory,
						environment: context.environment,
						stdio: stdio
					}),
					createJavaCommandConfiguration(configuration)
				);

				return {
					pid: Number(_subprocess.getPid()),
					kill: function() {
						_subprocess.terminate();
					},
					run: function() {
						var listener = new function() {
							this.status = void(0);

							this.finished = function(status) {
								this.status = status;
							};

							this.interrupted = function(_exception) {
								//	who knows what we should do here. Kill the process?
								throw new Error("Unhandled Java thread interruption.");
							};
						};

						//Packages.java.lang.System.err.println("Waiting for subprocess: " + _subprocess);
						_subprocess.wait(new JavaAdapter(
							Packages.inonit.system.Subprocess.Listener,
							listener
						));

						return {
							status: listener.status,
							stdio: stdio.close()
						}
					}
				};
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.run.Context } context
		 * @param { slime.jrunscript.shell.run.Configuration } configuration
		 * @returns { slime.$api.fp.world.Tell<slime.jrunscript.shell.run.TellEvents> }
		 */
		var tell = function(context,configuration) {
			/**
			 *
			 * @param { slime.$api.Events<slime.jrunscript.shell.run.TellEvents> } events
			 */
			return function(events) {
				var world = $context.world || realWorld;

				var subprocess = world.start({
					context: context,
					configuration: configuration,
					events: events
				});

				events.fire("start", {
					pid: subprocess.pid,
					kill: subprocess.kill
				});

				var exit = subprocess.run();

				events.fire("exit", exit);
			}
		};

		/**
		 *
		 * @param { slime.jrunscript.shell.run.Context } context
		 * @param { slime.jrunscript.shell.run.Configuration } configuration
		 * @returns { slime.$api.fp.world.old.Tell<slime.jrunscript.shell.run.TellEvents> }
		 */
		var impure = function(context,configuration) {
			return $api.Function.world.old.tell(
				tell(context, configuration)
			);
		};

		//	TODO	next two functions also copy-pasted into fixtures
		var isLineWithProperty = function(name) {
			return function(line) {
				return Boolean(line[name]);
			}
		}

		var hasLineWithProperty = function(name) {
			return function(lines) {
				return lines && lines.some(isLineWithProperty(name));
			}
		};

		/**
		 *
		 * @param { Pick<slime.jrunscript.shell.run.StdioConfiguration,"output" | "error"> } stdio
		 * @param { slime.jrunscript.shell.run.Mock } result
		 * @returns
		 */
		var mockTell = function(stdio,result) {
			var killed = false;
			return $api.Function.world.old.tell(
				/**
				 * @param { slime.$api.Events<slime.jrunscript.shell.run.TellEvents> } events
				 */
				function(events) {
					events.fire("start", {
						pid: result.pid || 0,
						kill: function() {
							killed = true;
						}
					});

					//	TODO	should emit at least one empty line for each if line buffering
					//	TODO	the below appears as though it would skip blank lines; should use isLineWithProperty and then
					//			fix that method
					if (result.lines) result.lines.forEach(function(line) {
						if (killed) return;
						if (stdio.output == "line" && line["stdout"]) {
							events.fire("stdout", { line: line["stdout"] });
						} else if (stdio.error == "line" && line["stderr"]) {
							events.fire("stderr", { line: line["stderr"] });
						}
					});

					/**
					 *
					 * @param { string } stdioName
					 * @param { string } eventName
					 * @returns { string }
					 */
					var getStdioProperty = function(stdioName, eventName) {
						if (stdio[stdioName] == "line" || stdio[stdioName] == "string") {
							if (hasLineWithProperty(eventName)(result.lines)) {
								return result.lines.filter(isLineWithProperty(eventName)).map(function(entry) {
									return entry[eventName]
								}).join("\n");
							}
							if (result.exit.stdio && result.exit.stdio[stdioName]) return result.exit.stdio[stdioName];
							return "";
						}
						return void(0);
					};

					if (!killed) {
						events.fire("exit", {
							status: result.exit.status,
							stdio: {
								output: getStdioProperty("output", "stdout"),
								error: getStdioProperty("error", "stderr")
							}
						});
					} else {
						events.fire("exit", {
							status: 143,
							//	TODO	the below is wrong, should terminate output and include only what happened
							//			before being killed
							stdio: {
								output: getStdioProperty("output", "stdout"),
								error: getStdioProperty("error", "stderr")
							}
						})
					}
				}
			)
		}

		/**
		 *
		 * @param { (invocation: slime.jrunscript.shell.run.Invocation) => slime.jrunscript.shell.run.Mock } delegate
		 * @returns
		 */
		var mockRun = function(delegate) {
			return (
				/**
				 *
				 * @param { slime.jrunscript.shell.run.Invocation } invocation
				 * @returns
				 */
				function(invocation) {
					var result = delegate(invocation);

					if (hasLineWithProperty("stdout")(result.lines) && result.exit.stdio && result.exit.stdio.output) throw new TypeError("Both stdout lines and stdout string supplied.");
					if (hasLineWithProperty("stderr")(result.lines) && result.exit.stdio && result.exit.stdio.error) throw new TypeError("Both stderr lines and stderr string supplied.");

					return mockTell(invocation.context.stdio, result);
				}
			)
		};

		/** @type { slime.jrunscript.shell.internal.run.Exports["old"]["run"] } */
		function oldRun(context, configuration, module, events, p, invocation, isLineListener) {
			var rv;
			var tell = impure(context, configuration);
			tell({
				start: function(e) {
					var startEvent = {
						command: invocation.command,
						arguments: invocation.arguments,
						environment: invocation.environment,
						directory: invocation.directory,
						pid: e.detail.pid,
						kill: e.detail.kill
					};

					if (p.on && p.on.start) {
						$api.deprecate(function() {
							p.on.start.call({}, startEvent);
						})();
					}
					module.events.fire("run.start", startEvent);
					events.fire("start", startEvent);
				},
				stdout: function(e) {
					if (p.stdio && p.stdio.output && isLineListener(p.stdio.output)) {
						p.stdio.output.line(e.detail.line);
					}
				},
				stderr: function(e) {
					if (p.stdio && p.stdio.error && isLineListener(p.stdio.error)) {
						p.stdio.error.line(e.detail.line);
					}
				},
				exit: function(e) {
					rv = $api.Object.compose(invocation, e.detail);
					events.fire("terminate", rv);
				}
			});
			return rv;
		}

		$export({
			question: function(invocation) {
				return function(events) {
					/** @type { slime.jrunscript.shell.run.Exit } */
					var rv;
					$api.Function.impure.now.process(
						$api.Function.world.tell(
							tell(invocation.context, invocation.configuration),
							{
								start: function(e) {
									events.fire("start", e.detail);
								},
								stdout: function(e) {
									events.fire("stdout", e.detail);
								},
								stderr: function(e) {
									events.fire("stderr", e.detail);
								},
								exit: function(e) {
									rv = e.detail;
								}
							}
						)
					);
					return rv;
				}
			},
			action: function(invocation) {
				return function(events) {
					$api.Function.impure.now.process(
						$api.Function.world.tell(
							tell(invocation.context, invocation.configuration),
							{
								start: function(e) {
									events.fire("start", e.detail);
								},
								stdout: function(e) {
									events.fire("stdout", e.detail);
								},
								stderr: function(e) {
									events.fire("stderr", e.detail);
								},
								exit: function(e) {
									events.fire("exit", e.detail);
								}
							}
						)
					);
				}
			},
			run: function(invocation) {
				return impure(invocation.context,invocation.configuration);
			},
			mock: {
				run: mockRun,
				tell: mockTell
			},
			old: {
				buildStdio: buildStdio,
				run: oldRun
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
