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
	 * @param { slime.project.jsapi.Context } $context
	 * @param { slime.loader.Export<slime.project.jsapi.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { string } string
		 */
		function prefix(string) {
			var trimmed = string.trim();
			if (trimmed.substring(0,3) == "/**") {
				return string.substring(0,string.indexOf("/**")) + " * ";
			}
			if (trimmed.substring(0,1) == "*") {
				return string.substring(0,string.indexOf("*")) + "* ";
			}
			return null;
		}

		function text(string) {
			var oneline = string.replace(/\n/g, " ");
			var before = prefix(oneline);
			var concatenated = oneline.substring(before.length);
			var tokens = concatenated.split(/\s+/g);
			return tokens.join(" ");
		}

		$export({
			test: {
				prefix: prefix,
				text: text
			},
			comment: function(format) {
				return function(input) {
					input = input.replace(/\<code\>/g, "`").replace(/\<\/code\>/g, "`");
					input = input.replace(/\<i\>/g, "*").replace(/\<\/i\>/g, "*");
					debugger;
					//input = text(input);
					return input;
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
