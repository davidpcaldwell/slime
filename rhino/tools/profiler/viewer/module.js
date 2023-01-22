//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.tools.profiler.rhino.viewer.Context } $context
	 * @param { slime.Loader } $loader
	 */
	function($context,$loader) {
		var profiles = $context.profiles;

		//	Pretty-printing explodes the size of this by about 7x even using tab (more with spaces)
		var json = JSON.stringify(profiles);

		if ($context.to.html) {
			var directory = $context.to.html.location.parent.createDirectory({
				exists: function(dir) {
					return false;
				}
			});

			var scriptElement = function(s) {
				return "<script type=\"text/javascript\">" + s + "</script>";
			}

			//	TODO	wherever this implementation comes from, it does *not* have .read.string(); fix it
			var html = $loader.get("viewer.html").read(String);
			//	TODO	this is pretty brittle; perhaps there is a better solution, especially as we mature jsh.document
			if ($context.to.html.inline.css) {
				html = html.replace("<link rel=\"stylesheet\" type=\"text/css\" href=\"viewer.css\" />", "<style type=\"text/css\">" + $loader.get("viewer.css").read(String) + "</style>");
			} else {
				directory.getRelativePath("viewer.css").write($loader.get("viewer.css").read(String));
			}

			if ($context.to.html.inline.json) {
				html = html.replace("<!-- INLINE PROFILES -->", scriptElement("var profiles = " + json));
			} else {
				directory.getRelativePath("profiles.json").write(json, { append: false, recursive: true });
			}

			if ($context.to.html.inline.js) {
				html = html.replace("<script type=\"text/javascript\" src=\"viewer.js\"></script>", scriptElement($loader.get("viewer.js").read(String)));
			} else {
				directory.getRelativePath("viewer.js").write($loader.get("viewer.js").read(String));
			}
			$context.to.html.location.write(html, { append: false, recursive: true });
			$context.console("Wrote profile viewer to " + $context.to.html.location);
		}

		if ($context.to.json) {
			$context.to.json.location.write(json, { append: false });
			$context.console("Wrote profiling data to " + $context.to.json.location);
		}
	}
//@ts-ignore
)($context,$loader);
