//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.Scope["$loader"] } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
 	 */
	function(jsh,$loader,plugin) {
		plugin({
			load: function() {
				jsh.loader.plugins($loader.Child("test/fifty/"));
			}
		});

		$loader.plugin("old/jsh/");

		plugin({
			isReady: function() {
				return Boolean(jsh.js);
			},
			load: function() {
				var code = {
					/** @type { slime.definition.verify.Script } */
					verify: $loader.script("verify.js")
				};

				jsh.unit = $loader.module("old/unit.js", {
					verify: code.verify()
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
				return Boolean(jsh.unit);
			},
			load: function() {
				var JsapiHtml = $loader.value("old/document-adapter.js");

				jsh.unit.jsapi = {};
				jsh.unit.jsapi.Html = function(base,document) {
					return new JsapiHtml(base,document);
				};
			}
		})
	}
//@ts-ignore
)(jsh,$loader,plugin);
