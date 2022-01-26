//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.http.client.curl.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.http.client.curl.Exports> } $export
	 */
	function($api,$context,$export) {
		var jsh = {
			/** @type { Pick<slime.jrunscript.shell.Exports,"world"|"Invocation"> & { console: (message: string) => void } } */
			shell: {
				Invocation: $context.library.shell.Invocation,
				world: $context.library.shell.world,
				console: $context.console
			}
		};

		/**
		 *
		 * @param { slime.jrunscript.http.client.spi.Argument } argument
		 * @returns { ReturnType<slime.jrunscript.http.client.World["request"]> }
		 */
		var curl = function(argument) {
			return $api.Function.impure.ask(function(events) {
				var output;

				jsh.shell.world.run(
					jsh.shell.Invocation.create({
						command: "curl",
						arguments: $api.Array.build(function(rv) {
							//	TODO	consider --max-time, though there is no URLConnection equivalent
							//	TODO	--connect-timeout
							rv.push("--request", argument.request.method);
							if (argument.request.headers && argument.request.headers.length) throw new Error();
							if (argument.request.body) {
								rv.push("--header", "Content-Type: " + jsh.io.mime.Type.codec.declaration.encode(argument.request.body.type));
								//	TODO	does not handle binary data
								rv.push("--data", argument.request.body.stream.character().asString());
							}
							if (argument.timeout.connect) {
								rv.push("--connect-timeout", (argument.timeout.connect / 1000).toFixed(3));
							}
							rv.push(argument.request.url);
						}),
						stdio: {
							output: "string",
							error: "line"
						}
					})
				)({
					stderr: function(e) {
						jsh.shell.console(e.detail.line);
					},
					exit: function(e) {
						output = e.detail.stdio.output;
					}
				});
				var buffer = new jsh.io.Buffer();
				buffer.writeText().write(output);
				buffer.writeText().close();
				return {
					status: void(0),
					headers: void(0),
					stream: buffer.readBinary()
				};
			});
		};

		$export(curl);
	}
//@ts-ignore
)($api,$context,$export);
