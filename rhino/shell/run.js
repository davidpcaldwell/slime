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
		/** @type { slime.jrunscript.shell.internal.run.Export["run"] } */
		function run(context, configuration, stdio, module, events, p, result) {
			//	TODO	could throw exception on launch; should deal with it
			var _subprocess = Packages.inonit.system.OperatingSystem.get().start(context, configuration);

			(
				function fireStartEvent() {
					var startEvent = new function() {
						this.command = result.command;
						this.arguments = result.arguments;

						this.environment = result.environment;

						this.directory = result.directory;

						Object.defineProperty(this, "pid", {
							get: function() {
								return _subprocess.getPid();
							},
							enumerable: true
						});

						this.kill = function() {
							_subprocess.terminate();
						}
					};
					if (p.on && p.on.start) {
						$api.deprecate(function() {
							p.on.start.call({}, startEvent);
						})();
					}
					module.events.fire("run.start", startEvent);
					events.fire("start", startEvent);
				}
			)();

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

			result.status = listener.status;

			stdio.close();

			["output","error"].forEach(function(stream) {
				if (typeof(stdio[stream]) == "string") {
					if (!result.stdio) result.stdio = {};
					result.stdio[stream] = stdio[stream];
				}
			});

			events.fire("terminate", result);
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.invocation.Stdio } p
		 * @returns { slime.jrunscript.shell.internal.module.RunStdio }
		 */
		function buildStdio(p) {
			var rv = {};
			var buffers = {};

			["output","error"].forEach(function(stream) {
				if (p[stream] == String) {
					buffers[stream] = new $context.api.io.Buffer();
					rv[stream] = buffers[stream].writeBinary();
				} else if (p[stream] && typeof(p[stream]) == "object" && p[stream].line) {
					buffers[stream] = new (function(callback) {
						var buffer = new $context.api.io.Buffer();

						var thread = $context.api.java.Thread.start({
							call: function() {
								buffer.readText().readLines(callback);
							}
						});

						this.buffer = buffer;

						this.close = function() {
							buffer.close();
							thread.join();
						}
					})(p[stream].line);
					rv[stream] = buffers[stream].buffer.writeBinary();
				} else {
					rv[stream] = p[stream];
				}
			});

			if (typeof(p.input) == "string") {
				var buffer = new $context.api.io.Buffer();
				buffer.writeText().write(p.input);
				buffer.close();
				rv.input = buffer.readBinary();
			} else {
				rv.input = p.input;
			}

			rv.close = function() {
				for (var x in buffers) {
					buffers[x].close();

					//	TODO	say what, now?
					if (buffers[x].readText) {
						this[x] = buffers[x].readText().asString();
					}
				}
			};

			return rv;
		}

		$export({
			run: run,
			buildStdio: buildStdio
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$api,$context,$export);
