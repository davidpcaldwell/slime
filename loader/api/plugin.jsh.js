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
	load: function() {
		jsh.unit = $loader.file("unit.js");
		jsh.unit.html = $loader.module("api.html.js", new function() {
			var seq = 0;

			this.Verify = jsh.unit.Verify;

			this.run = function(code,scope) {
				var source = code;
				if (typeof(source) == "string") {
					//	TODO	move this processing inside the jsh loader (or rhino loader?) so that it can be invoked with name/string
					//			properties. This code, after being moved to jsh loader, can then invoke rhino loader with name/_in
					//			created below then we would invoke jsh loader here with code = { name: ..., string: code }
					//	TODO	it seems likely a more useful name could be used here, perhaps using name of file plus jsapi:id path
					source = {
						name: "<eval>:" + String(++seq),
						_in: (function() {
							var out = new Packages.java.io.ByteArrayOutputStream();
							var writer = new Packages.java.io.OutputStreamWriter(out);
							writer.write(String(code));
							writer.flush();
							writer.close();
							return new Packages.java.io.ByteArrayInputStream(out.toByteArray());
						})()
					}
				}
//				try {
					jsh.loader.run(source,scope);
//				} catch (e) {
//					Packages.java.lang.System.err.println("Error executing " + code);
//					throw e;
//				}
			}

			if (jsh.$jsapi && jsh.$jsapi.$rhino && jsh.$jsapi.$rhino.jsapi && jsh.$jsapi.$rhino.jsapi.script) {
				this.script = function(name,code,scope) {
					return jsh.$jsapi.$rhino.jsapi.script(name, String(code), scope);
				}
			}
		});
	}
});