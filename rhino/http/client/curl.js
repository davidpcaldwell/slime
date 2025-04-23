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
		/**
		 * @type { slime.jrunscript.http.client.curl.Exports }
		 */
		var curl = function(p) {
			if (!p) p = {};
			/**
			 *
			 * @param { slime.jrunscript.http.client.spi.Argument } argument
			 * @returns { ReturnType<slime.jrunscript.http.client.spi.Implementation> }
			 */
			function implementation(argument) {
				return function(events) {
					/** @type { slime.jrunscript.http.client.Response } */
					var response;

					$api.fp.world.now.action(
						$context.library.shell.world.action,
						$context.library.shell.Invocation.from.argument({
							//	TODO	should not assume location and/or PATH
							command: "curl",
							arguments: $api.Array.build(function(rv) {
								if (p.unixSocket) rv.push("--unix-socket", p.unixSocket);
								rv.push("--include");
								rv.push("--request", argument.request.method);
								if (argument.request.headers) {
									argument.request.headers.forEach(function(header) {
										rv.push("--header", header.name + ": " + header.value);
									});
								}
								if (argument.request.body) {
									rv.push("--header", "Content-Type: " + $context.library.io.mime.Type.codec.declaration.encode(argument.request.body.type));
									//	TODO	does not handle binary data
									rv.push("--data", argument.request.body.stream.character().asString());
								}
								if (argument.timeout && argument.timeout.connect) {
									rv.push("--connect-timeout", (argument.timeout.connect / 1000).toFixed(3));
								}
								//	TODO	consider --max-time, though there is no URLConnection equivalent
								//	TODO	investigate whether there is a read timeout equivalent
								rv.push($context.library.web.Url.codec.string.encode(argument.request.url));
							}),
							stdio: {
								output: "string",
								error: "line"
							}
						}),
						{
							stderr: function(e) {
								$context.console(e.detail.line);
							},
							exit: function(e) {
								if (e.detail.status == 7) throw new Error("Connection refused.");
								var output = e.detail.stdio.output;
								var lines = output.split("\n");

								var noCarriageReturn = function(line) {
									if ($api.fp.string.endsWith("\r")(line)) {
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


								while(typeof(lines[index]) == "string" && notBlank(lines[index])) {
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
										var buffer = new $context.library.io.Buffer();
										buffer.writeText().write(string);
										buffer.writeText().close();
										return buffer.readBinary();
									})(lines.slice(index+1).join("\n"))
								}
							}
						}
					);

					return response;
				};
			}

			return implementation;
		}

		$export(curl);
	}
//@ts-ignore
)($api,$context,$export);
