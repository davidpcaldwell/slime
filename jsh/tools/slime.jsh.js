//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the jsh JavaScript/Java shell.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

//	TODO	Allow compilation dependencies
var parameters = jsh.shell.getopts({
	options: {
		from: jsh.file.Pathname,
		to: jsh.file.Pathname,
		format: "zip"
	}
});

var from = parameters.options.from.directory;
var format = parameters.options.format;

var build = (function() {
	if (format == "zip") {
		var TMP = jsh.file.filesystems.os.Pathname(String(jsh.shell.properties.java.io.tmpdir)).directory;
		return TMP.getRelativePath("slime/" + from.pathname.basename + "-" + String(new Date().getTime())).createDirectory({ recursive: true });
	} else if (format == "directory") {
		return parameters.options.to.createDirectory();
	} else {
		jsh.java.fail("Unknown -format: " + format);
	}
})();

jsh.loader.file(jsh.script.getRelativePath("slime.js")).slime.build.jsh(from,build);

if (format == "zip") {
	jsh.file.zip({ from: build.pathname, to: parameters.options.to });
} else if (format == "directory") {
} else {
}
