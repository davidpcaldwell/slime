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

		/**
		 * @type { slime.jrunscript.shell.internal.run.Export["buildStdio"] }
		 */
		function buildStdio(p) {
			/** @type { slime.jrunscript.shell.internal.run.Stdio } */
			var rv = {};
			/** @type { { [x: string]: slime.jrunscript.shell.internal.run.Buffer } } */
			var buffers = {};

			/** @returns { slime.jrunscript.shell.internal.run.Buffer } */
			var getStringBuffer = function() {
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
			 * @param { slime.$api.Events<slime.jrunscript.shell.internal.run.Events> } events
			 * @param { "stdout" | "stderr" } type
			 * @returns { slime.jrunscript.shell.internal.run.Buffer }
			 */
			var getLineBuffer = function(events,type) {
				var buffer = new $context.api.io.Buffer();

				var lines = [];

				var thread = $context.api.java.Thread.start({
					call: function() {
						buffer.readText().readLines(function(line) {
							lines.push(line);
							events.fire(type, { line: line });
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

			if (typeof(p.input) == "string") {
				var buffer = new $context.api.io.Buffer();
				buffer.writeText().write(p.input);
				buffer.close();
				rv.input = buffer.readBinary();
			} else {
				rv.input = p.input;
			}

			var listeners = {
				stdout: void(0),
				stderr: void(0)
			};

			var toListener = function(type,callback,events) {
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
			 * @returns { { output?: string, error?: string } }
			 */
			rv.close = function() {
				/** @type { { output?: string, error?: string } } */
				var rv;
				for (var x in buffers) {
					buffers[x].close();

					if (listeners.stdout) listeners.stdout.close();
					if (listeners.stderr) listeners.stderr.close();

					//	this is horrendous, but it automatically replaces the stdio property with the string if a string-buffering
					//	strategy was requested.
					if ((x == "output" || x == "error") && buffers[x]) {
						if (!rv) rv = {};
						rv[x] = buffers[x].readText();
					}
				}
				return rv;
			};

			/** @type { ReturnType<slime.jrunscript.shell.internal.run.Export["buildStdio"]>}  */
			var returned = function(events) {
				/**
				 * @param { string } stream
				 * @returns { "stdout" | "stderr" }
				 */
				var toStreamEventType = function(stream) {
					if (stream == "output") return "stdout";
					if (stream == "error") return "stderr";
				};

				["output","error"].forEach(function(stream) {
					if (p[stream] == String) {
						buffers[stream] = getStringBuffer();
					} else if (p[stream] && typeof(p[stream]) == "object" && p[stream].line) {
						buffers[stream] = getLineBuffer(events, toStreamEventType(stream));
						listeners[toStreamEventType(stream)] = toListener(toStreamEventType(stream), p[stream].line, events);
					}

					if (buffers[stream]) {
						rv[stream] = buffers[stream].stream;
					} else {
						rv[stream] = p[stream];
					}
				});

				return rv;
			};

			return returned;
		}

		$export({
			run: run,
			old: {
				run: oldRun
			},
			buildStdio: buildStdio
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
