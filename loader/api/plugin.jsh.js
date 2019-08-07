//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js;
	},
	load: function() {
		jsh.unit = $loader.file("unit.js", {
		});
		jsh.unit.html = $loader.module("api.html.js", new function() {
			this.api = new function() {
				// TODO: Should be able to switch to Object.assign
				this.assign = jsh.js.Object.set;
			}

			var seq = 0;

			this.Verify = jsh.unit.Verify;
			this.Suite = jsh.unit.Suite;

			this.run = function(code,scope) {
				var source = code;
				if (typeof(source) == "string") {
					//	TODO	move this processing inside the jsh loader (or rhino loader?) so that it can be invoked with name/string
					//			properties. This code, after being moved to jsh loader, can then invoke rhino loader with name/_in
					//			created below then we would invoke jsh loader here with code = { name: ..., string: code }
					//	TODO	it seems likely a more useful name could be used here, perhaps using name of file plus jsapi:id path
					source = {
						name: "eval://" + String(++seq),
						type: "application/javascript",
						string: code
					}
				}
				jsh.loader.run(source,scope);
			}
		});
	}
});

plugin({
	isReady: function() {
		return jsh.shell && jsh.shell.jsh && jsh.shell.jsh.src;
	},
	load: function() {
		//	TODO	can rely on jsh plugin when it is implemented, and not worry about source shell
		var library = {
			document: jsh.loader.module(
				jsh.shell.jsh.src.getRelativePath("loader/document"),
				{ $slime: $slime }
			)
		};

		jsh.definition = {};
		jsh.definition.Html = function(o) {
			var document = library.document.parse({
				loader: $loader,
				path: "api.template.html"
			});
		}
	}
});
