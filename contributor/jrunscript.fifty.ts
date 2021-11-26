//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.kit
	) {
		var jsh = fifty.global.jsh;

		fifty.tests.suite = function() {
			var isDocker = Boolean(fifty.global.jsh.file.Pathname("/slime").directory);

			fifty.load("../loader/expression.fifty.ts");
			fifty.load("../loader/$api-Function.fifty.ts");
			fifty.load("../loader/mime.fifty.ts");
			fifty.load("../loader/jrunscript/java.fifty.ts");
			fifty.load("../rhino/system/test/Packages.inonit.system.fifty.ts");
			fifty.load("../rhino/jrunscript/api.fifty.ts");
			if (jsh.shell.tools.jsoup.installed) fifty.load("../loader/document/module.fifty.ts");
			fifty.load("../js/web/module.fifty.ts");
			fifty.load("../jrunscript/host/module.fifty.ts");
			fifty.load("../jrunscript/io/plugin.jsh.fifty.ts");
			fifty.load("../jrunscript/tools/install/module.fifty.ts");
			fifty.load("../rhino/ip/module.fifty.ts");
			fifty.load("../rhino/http/client/module.fifty.ts");
			fifty.load("../rhino/shell/module.fifty.ts");
			fifty.load("../rhino/tools/docker/module.fifty.ts");
			fifty.load("../rhino/tools/github/module.fifty.ts");
			fifty.load("../rhino/tools/git/module.fifty.ts");
			fifty.load("../jsh/loader/jsh.fifty.ts");
			fifty.load("../jsh/script/plugin.jsh.fifty.ts");
			if (!isDocker) fifty.load("../jsh/unit/plugin.jsh.web.fifty.ts");
			fifty.load("../rhino/http/servlet/plugin.jsh.resources.fifty.ts");
			fifty.load("../tools/wf/plugin.jsh.fifty.ts");
			if (!isDocker) fifty.load("../tools/wf/plugin-standard.jsh.fifty.ts");
			//fifty.load("../");
		}
	}
//@ts-ignore
)(fifty);
