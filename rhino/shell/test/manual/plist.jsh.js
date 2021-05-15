//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		file: jsh.file.Pathname
	}
});

var document = new jsh.document.Document({ file: parameters.options.file.file });
var parsed = new jsh.shell.system.apple.plist.xml.decode(document);
jsh.shell.console(JSON.stringify(parsed,void(0),"    "));

var written = jsh.shell.system.apple.plist.xml.encode(parsed);
jsh.shell.console(written);
