//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jrunscript/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var multipart = new jsh.io.mime.Multipart({
	subtype: "alternative",
	parts: [
		{
			type: new jsh.io.mime.Type("text", "plain"),
			string: "Hello, World"
		},
		{
			type: new jsh.io.mime.Type("text", "html"),
			string: "<html><body>Hello, World</body></html>",
			filename: "second",
			disposition: "attachment"
		}
	]
});

jsh.io.Streams.binary.copy(multipart.read.binary(), jsh.shell.stdout);

jsh.shell.echo("MIME type for index.html = " + jsh.io.mime.Type.guess({ name: "index.html" }));
