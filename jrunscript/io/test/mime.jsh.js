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
		var multipart = jsh.io.mime.Multipart({
			subtype: "alternative",
			parts: [
				//	TODO	failed type checking below may indicate problem
				//@ts-ignore
				{
					type: jsh.io.mime.Type("text", "plain"),
					string: "Hello, World"
				},
				{
					type: jsh.io.mime.Type("text", "html"),
					string: "<html><body>Hello, World</body></html>",
					filename: "second",
					//	TODO	failed type checking below may indicate problem
					//@ts-ignore
					disposition: "attachment"
				}
			]
		});

		//	TODO	need to think through what type information should be below
		//@ts-ignore
		jsh.io.Streams.binary.copy(multipart.read.binary(), jsh.shell.stdout);

		jsh.shell.echo("MIME type for index.html = " + jsh.io.mime.Type.guess({ name: "index.html" }));
	}
//@ts-ignore
)($api,jsh);
