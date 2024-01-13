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
		/**
		 *
		 * @param { slime.jrunscript.shell.run.old.Invocation } old
		 * @returns { slime.jrunscript.shell.run.Invocation }
		 */
		var modernize = function(old) {
			return {
				command: old.configuration.command,
				arguments: old.configuration.arguments,
				environment: old.context.environment,
				directory: old.context.directory,
				stdio: old.context.stdio
			}
		};

		/**
		 *
		 * @param { slime.jrunscript.shell.run.StdioConfiguration } p
		 * @returns { (events: slime.$api.event.Emitter<slime.jrunscript.shell.run.TellEvents>) => slime.jrunscript.shell.internal.run.Stdio }
		 */
		function buildStdio(p) {
			/**
			 * @param { string } stream
			 * @returns { "stdout" | "stderr" }
			 */
			var toStreamEventType = function(stream) {
				if (stream == "output") return "stdout";
				if (stream == "error") return "stderr";
			};

			/**
			 *
			 * @param { Omit<slime.jrunscript.runtime.io.OutputStream, "close"> } stream
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
			 * @param { slime.$api.event.Emitter<slime.jrunscript.shell.run.TellEvents> } events
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
			 * @param { slime.$api.event.Emitter<slime.jrunscript.shell.run.TellEvents> } events
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

		/** @type { slime.jrunscript.shell.internal.run.Context["spi"] } */
		var spi = $context.spi || function(p) {
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
						getStandardOutput: $api.fp.returning( (context.stdio.output) ? context.stdio.output.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM ),
						getStandardError: $api.fp.returning( (context.stdio.error) ? context.stdio.error.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.OUTPUT_STREAM ),
						getStandardInput: $api.fp.returning( (context.stdio.input) ? context.stdio.input.java.adapt() : Packages.inonit.script.runtime.io.Streams.Null.INPUT_STREAM ),
						getSubprocessEnvironment: $api.fp.returning( _environment ),
						getWorkingDirectory: $api.fp.returning((context.directory) ? context.directory.pathname.java.adapt() : null)
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

						this.getCommand = $api.fp.returning(adapted.command);
						this.getArguments = $api.fp.returning(adapted.arguments);
					}
				);
			};

			return function(events) {
				var stdio = buildStdio(p.stdio)(events);

				//	TODO	could throw exception on launch; should deal with it

				//	TODO	currently we can start firing stdio events before we fire the start event, given how this
				//			implementation works. That's probably not ideal, a more rigorous event sequence would be better.
				var _context = createJavaCommandContext({
					directory: (p.directory) ? $context.api.file.Pathname(p.directory).directory : void(0),
					environment: p.environment,
					stdio: stdio
				});

				var _configuration = createJavaCommandConfiguration({
					command: p.command,
					arguments: p.arguments
				});

				var _subprocess = Packages.inonit.system.OperatingSystem.get().start(
					_context,
					_configuration
				);

				events.fire("start", {
					pid: Number(_subprocess.getPid()),
					kill: function() {
						_subprocess.terminate();
					}
				});

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

				events.fire("exit", {
					status: listener.status,
					stdio: stdio.close()
				});
			}
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
			return $api.fp.world.old.tell(
				/**
				 * @param { slime.$api.event.Emitter<slime.jrunscript.shell.run.TellEvents> } events
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
		 * @param { (invocation: slime.jrunscript.shell.run.old.Invocation) => slime.jrunscript.shell.run.Mock } delegate
		 * @returns
		 */
		var mockRun = function(delegate) {
			return (
				/**
				 *
				 * @param { slime.jrunscript.shell.run.old.Invocation } invocation
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
			var tell = spi(modernize({ context: context, configuration: configuration }));
			$api.fp.world.now.tell(
				tell,
				{
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
				}
			);
			return rv;
		}

		$export({
			exports: {
				Invocation: {
					from: {
						intention: function(parent) {
							/**
							 *
							 * @param { string | slime.jrunscript.runtime.io.InputStream } p
							 * @return { slime.jrunscript.runtime.io.InputStream }
							 */
							var toInputStream = function(p) {
								if (typeof(p) == "string") {
									var buffer = new $context.api.io.Buffer();
									buffer.writeText().write(p);
									buffer.close();
									return buffer.readBinary();
								} else {
									return p;
								}
							};

							return function(plan) {
								var environment = plan.environment || $api.fp.identity;
								return {
									command: plan.command,
									arguments: plan.arguments || [],
									environment: environment(parent.environment),
									directory: plan.directory || parent.directory,
									stdio: {
										//	TODO	maybe should supply empty InputStream right here
										input: (plan.stdio && plan.stdio.input) ? toInputStream(plan.stdio.input) : null,
										output: (plan.stdio && plan.stdio.output) ? plan.stdio.output : parent.stdio.output,
										error: (plan.stdio && plan.stdio.error) ? plan.stdio.error : parent.stdio.error
									}
								}
							}
						}
					},
					action: function(invocation) {
						return spi(invocation);
					},
					question: function(invocation) {
						return function(events) {
							/** @type { slime.jrunscript.shell.run.Exit } */
							var rv;
							$api.fp.impure.now.process(
								$api.fp.world.process(
									spi(invocation),
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
					}
				},
			},
			action: function(old) {
				return spi(modernize(old));
			},
			question: function(invocation) {
				return function(events) {
					/** @type { slime.jrunscript.shell.run.Exit } */
					var rv;
					$api.fp.impure.now.process(
						$api.fp.world.process(
							spi(modernize(invocation)),
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
			run: function(invocation) {
				return function(handler) {
					$api.fp.world.now.tell(
						spi(modernize(invocation)),
						handler
					);
				}
			},
			mock: mockRun,
			internal: {
				mock: {
					tell: mockTell
				}
			},
			old: {
				buildStdio: buildStdio,
				run: oldRun
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
