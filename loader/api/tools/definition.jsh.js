//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		//	Path to which to emit the file
		to: jsh.file.Pathname,

		//	If true, links to CSS and JS resources in this SLIME distribution, rather than linking to online copies
		link: false
	}
});

if (!parameters.options.to) {
	jsh.shell.console("Usage: " + jsh.script.file + " -to <destination-file>");
	jsh.shell.exit(1);
}

var templateXml = (function() {
	var slime = jsh.script.file.parent.parent.parent.parent;
	var template = slime.getFile("loader/api/api.template.html").read(String);

	if (parameters.options.link) {
		(function() {
			var slimepath = "http://bb.githack.com/davidpcaldwell/slime/raw/tip/";
			var to = {
				slime: jsh.file.navigate({
					from: parameters.options.to,
					to: slime
				})
			};
			
			while(template.indexOf(slimepath) != -1) {
				template = template.replace(slimepath, to.slime.relative);
			}		
		})();
	}
	return template;
})();

var document = new jsh.document.Document({
	string: templateXml
});

(function removeLicense() {
	document.children.splice(0,1);
})();

parameters.options.to.write(document.toString(), { append: false });
