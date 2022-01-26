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
		//	TODO	get rid of this shim
		var jsh = {
			/** @type { { Buffer: any, mime: slime.jrunscript.io.mime.Exports } } */
			io: {
				Buffer: $context.library.io.Buffer,
				mime: $context.library.io.mime
			},
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
				/** @type { slime.jrunscript.http.client.spi.Response } */
				var response;

				jsh.shell.world.run(
					jsh.shell.Invocation.create({
						command: "curl",
						arguments: $api.Array.build(function(rv) {
							//	TODO	consider --max-time, though there is no URLConnection equivalent
							//	TODO	--connect-timeout
							rv.push("--include");
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
						var output = e.detail.stdio.output;
						var lines = output.split("\n");

						var noCarriageReturn = function(line) {
							if ($api.Function.string.endsWith("\r")(line)) {
								line = line.substring(0,line.length-1);
							}
							return line;
						};

						var notBlank = function(line) {
							return noCarriageReturn(line).length != 0;
						};

						var statusLine = noCarriageReturn(lines[0]);
						var statusTokens = statusLine.split(" ");
						var index = 1;
						var headers = [];


						while(notBlank(lines[index])) {
							var parsed = noCarriageReturn(lines[index]).split(": ");
							headers.push({ name: parsed[0], value: parsed.slice(1).join(": ") });
							index++;
						}
						response = {
							status: {
								code: Number(statusTokens[1]),
								reason: statusTokens.slice(2).join(" "),
							},
							headers: headers,
							stream: (function(string) {
								var buffer = new jsh.io.Buffer();
								buffer.writeText().write(string);
								buffer.writeText().close();
								return buffer.readBinary();
							})(lines.slice(index+1).join("\n"))
						}
					}
				});
				return response;
			});
		};

		$export(curl);
	}
//@ts-ignore
)($api,$context,$export);
