//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.script.Application.run({
	commands: {
		definition: {
			getopts: {
				options: {
					to: jsh.file.Pathname
				}
			},
			run: function(parameters) {
				var code = jsh.shell.jsh.src.getFile("loader/api/api.template.html").read(String);
				var start = code.indexOf("<!DOCTYPE");
				code = code.substring(start);
				parameters.options.to.write(code, { append: false });
			}
		}
	}
})
