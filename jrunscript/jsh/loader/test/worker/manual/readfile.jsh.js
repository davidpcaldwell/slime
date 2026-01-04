//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		/** @type { <E,R extends slime.$api.fp.Data>(q: slime.$api.fp.world.Question<E,R>) => void } */
		var PromiseImplementation = function(q) {
			var rv = q({
				fire: function(name,value) {
					var event = {
						type: name,
						detail: value
					};

					/** @type { slime.js.Cast<slime.$api.fp.Data> } */
					var asData = $api.fp.cast.unsafe;

					jsh.loader.worker.postMessage({
						type: "event",
						value: {
							type: asData(event.type),
							//	source
							//	path
							timestamp: event.timestamp,
							detail: asData(event.detail)
						}
					});
				},
				listeners: void(0)
			});
			jsh.loader.worker.postMessage({ type: "fulfilled", value: rv });
		}

		jsh.script.cli.main(function(invocation) {
			if (invocation.arguments.length == 2 && invocation.arguments[0] == "worker") {
				//	TODO	for now, we read the whole file and then stream the lines, but obviously we can do better
				//	TODO	how can we convert a command-line argument into a jsh.file.Location?
				PromiseImplementation(
					function(events) {
						var location = jsh.file.Location.from.os(invocation.arguments[1]);
						var text = $api.fp.now(
							location,
							jsh.file.Location.file.read.string.simple
						);
						text.split("\n").forEach(function(line) {
							events.fire("line", line);
						});
						return void(0);
					}
				);
			} else {
				var worker = jsh.loader.worker.create({
					script: jsh.script.file,
					arguments: ["worker", invocation.arguments[0]],
					onmessage: function(e) {
						if (e.detail.type == "event") {
							//	TODO	only if type is line
							jsh.shell.console("LINE: " + e.detail.value.detail);
						} else if (e.detail.type == "fulfilled") {
							jsh.shell.console("END OF FILE");
							worker.terminate();
							jsh.shell.console("Worker terminated.");
						} else {
							throw new Error();
						}
					}
				});
				jsh.shell.console("Done with main script.");
			}
		});
	}
//@ts-ignore
)($api,jsh);
