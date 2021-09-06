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
	 * @param { slime.loader.Export<slime.jrunscript.shell.internal.run.Export> } $export
	 */
	function(Packages,JavaAdapter,$api,$context,$export) {
		/**
		 * @type { slime.jrunscript.shell.internal.run.Export["buildStdio"] }
		 */
		function buildStdio(p) {
			/** @type { slime.jrunscript.shell.internal.run.Stdio } */
			var rv = {};
			/** @type { { [x: string]: slime.jrunscript.shell.internal.run.OutputDestination } } */
			var destinations = {};

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
			 *
			 * @param { "stdout" | "stderr" } type
			 * @param { (string: string) => void } callback
			 * @param { slime.$api.Events<slime.jrunscript.shell.internal.run.Events> } events
			 * @returns { slime.jrunscript.shell.internal.run.Listener }
			 */
			var toListener = function(type,callback,events) {
				/** @type { slime.$api.event.Handler<slime.jrunscript.shell.internal.run.Line> } */
				var handler = function(e) {
					callback(e.detail.line);
				};

				events.listeners.add(type, handler);

				return {
					close: function() {
						events.listeners.remove(type, handler);
					}
				}
			}

			/**
			 * @param { slime.$api.Events<slime.jrunscript.shell.internal.run.Events> } events
			 * @param { "output" | "error" } stream
			 * @param { (string: string) => void } callback
			 * @returns { slime.jrunscript.shell.internal.run.OutputDestination }
			 */
			var getLineBufferDestination = function(events,stream,callback) {
				/**
				 * @param { string } stream
				 * @returns { "stdout" | "stderr" }
				 */
				var toStreamEventType = function(stream) {
					if (stream == "output") return "stdout";
					if (stream == "error") return "stderr";
				};

				var listener = toListener(toStreamEventType(stream), callback, events);

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
						listener.close();
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

			rv.input = p.input;

			/**
			 * @returns { { output?: string, error?: string } }
			 */
			rv.close = function() {
				/** @type { { output?: string, error?: string } } */
				var rv;
				for (var x in destinations) {
					destinations[x].close();

					//	this is horrendous, but it automatically replaces the stdio property with the string if a string-buffering
					//	strategy was requested.
					if ((x == "output" || x == "error") && destinations[x] && destinations[x].readText) {
						if (!rv) rv = {};
						rv[x] = destinations[x].readText();
					}
				}
				return rv;
			};

			/**
			 * @param { slime.jrunscript.shell.invocation.OutputStreamConfiguration } configuration
			 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToLines }
			 */
			var isLineListener = function(configuration) {
				return configuration && Object.prototype.hasOwnProperty.call(configuration, "line");
			}

			/**
			 * @param { slime.jrunscript.shell.invocation.OutputStreamConfiguration } configuration
			 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToString }
			 */
			var isString = function(configuration) {
				return configuration === String
			};

			/**
			 * @param { slime.jrunscript.shell.invocation.OutputStreamConfiguration } configuration
			 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToStream }
			 */
			var isRaw = function(configuration) {
				return true;
			}

			var destinationFactory = function(events, stream) {
				/**
				 * @param { slime.jrunscript.shell.invocation.OutputStreamConfiguration } configuration
				 * @returns { slime.jrunscript.shell.internal.run.OutputDestination }
				 */
				var getDestination = function(configuration) {
					if (isString(configuration)) {
						return getStringBufferDestination();
					} else if (isLineListener(configuration)) {
						return getLineBufferDestination(events, stream, configuration.line);
					} else if (isRaw(configuration)) {
						return getRawDestination(configuration);
					}
				};

				return getDestination;
			};

			/** @type { ReturnType<slime.jrunscript.shell.internal.run.Export["buildStdio"]>}  */
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

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.run.java.Context } context
		 * @param { slime.jrunscript.shell.internal.run.java.Configuration } configuration
		 * @returns { slime.$api.fp.impure.Tell<slime.jrunscript.shell.internal.run.Events> }
		 */
		var run = function(context,configuration) {
			return $api.Function.impure.tell(
				/**
				 *
				 * @param { slime.$api.Events<slime.jrunscript.shell.internal.run.Events> } events
				 */
				function(events) {
					//	TODO	could throw exception on launch; should deal with it
					var _subprocess = Packages.inonit.system.OperatingSystem.get().start(
						createJavaCommandContext(context),
						createJavaCommandConfiguration(configuration)
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
						stdio: context.stdio.close()
					});
				}
			);
		};

		/** @type { slime.jrunscript.shell.internal.run.Export["old"]["run"] } */
		function oldRun(context, configuration, module, events, p, invocation) {
			var rv;
			var tell = run(context, configuration);
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
				exit: function(e) {
					rv = $api.Object.compose(invocation, e.detail);
					events.fire("terminate", rv);
				}
			});
			return rv;
		}

		$export({
			buildStdio: buildStdio,
			run: run,
			old: {
				run: oldRun
			}
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
