//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.tools.profiler.Context } $context
	 * @param { slime.Loader } $loader
	 */
	function($context,$loader) {
		var settings = {
			inline: {
				json: true
			}
		}

		var profiles = $context.profiles;
		var directory = $context.to.parent.createDirectory({
			exists: function(dir) {
				return false;
			}
		});
		var output = {
			html: $context.to,
			json: directory.getRelativePath("profiles.json")
		};
		//	First, copy the HTML
		output.html = $context.to;
		//	TODO	wherever this implementation comes from, it does *not* have .read.string(); fix it
		var html = $loader.get("viewer.html").read(String);
		var scriptElement = function(s) {
			return "<script type=\"text/javascript\">" + s + "</script>";
		}
		//	TODO	this is pretty brittle; perhaps there is a better solution, especially as we mature jsh.document
		html = html.replace("<link rel=\"stylesheet\" type=\"text/css\" href=\"viewer.css\" />", "<style type=\"text/css\">" + $loader.get("viewer.css").read(String) + "</style>");

		//	Pretty-printing explodes the size of this by about 7x even using tab (more with spaces)
		var json = JSON.stringify(profiles);

		if (settings.inline.json) {
			html = html.replace("<script type=\"text/javascript\" src=\"profiles.js\"></script>", scriptElement("var profiles = " + json));
		} else {
			output.json.write(json, { append: false });
		}

		html = html.replace("<script type=\"text/javascript\" src=\"viewer.js\"></script>", scriptElement($loader.get("viewer.js").read(String)));

		output.html.write(html, { append: false });

		$context.console("Wrote profiling data to " + output.html);
	}
//@ts-ignore
)($context,$loader);
