//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		var jsh = fifty.global.jsh;

		fifty.tests.suite = function() {
			var hasJsoup = Boolean(jsh.shell.tools.jsoup.installed);

			var hasGit = (
				function() {
					if (jsh.shell.environment.SLIME_TEST_NO_GIT) return false;
					return Boolean(jsh.shell.PATH.getCommand("git"));
				}
			)();

			var isGitClone = (function() {
				var SLIME = fifty.jsh.file.object.getRelativePath("..").directory;
				return Boolean(SLIME.getSubdirectory(".git") || SLIME.getFile(".git"));
			})();

			var isMkcertImplemented = (function() {
				if (jsh.shell.environment.SLIME_TEST_NO_MKCERT) return false;
				if (jsh.shell.os.name == "Mac OS X") return true;
				if (jsh.shell.os.name == "Linux") return true;
			})();

			//	TODO	expression.fifty.ts, particuarly in the realm of $platform, has engine-specific stuff; would be good to
			//			test it per-engine
			fifty.load("../loader/expression.fifty.ts");

			fifty.load("../loader/jrunscript/expression.fifty.ts");
			fifty.load("../loader/api/verify.fifty.ts");
			fifty.load("../loader/api/old/unit.fifty.ts");
			fifty.load("../rhino/system/test/Packages.inonit.system.fifty.ts");
			fifty.load("../rhino/system/java/inonit/script/runtime/io/Streams.fifty.ts");
			fifty.load("../rhino/jrunscript/api.fifty.ts");
			if (hasJsoup) fifty.load("../loader/document/module.fifty.ts");
			fifty.load("../js/document/module.fifty.ts");
			fifty.load("../js/web/module.fifty.ts");
			fifty.load("../js/codec/ini.fifty.ts");
			fifty.load("../js/time/module.fifty.ts");
			fifty.load("../js/object/module.fifty.ts");
			fifty.load("../jrunscript/host/module.fifty.ts");
			fifty.load("../jrunscript/io/module.fifty.ts");
			fifty.load("../jrunscript/io/plugin.jsh.fifty.ts");
			fifty.load("../jrunscript/tools/install/module.fifty.ts");
			fifty.load("../rhino/document/plugin.jsh.fifty.ts");
			fifty.load("../rhino/ip/module.fifty.ts");
			fifty.load("../rhino/http/client/module.fifty.ts");
			fifty.load("../rhino/file/module.fifty.ts");
			fifty.load("../rhino/shell/module.fifty.ts");
			fifty.load("../rhino/shell/browser/module.fifty.ts");
			fifty.load("../jrunscript/jsh/shell/plugin.jsh.fifty.ts");
			fifty.load("../rhino/tools/module.fifty.ts");
			fifty.load("../rhino/tools/plugin.jsh.fifty.ts");
			fifty.load("../rhino/tools/node/module.fifty.ts");
			if (!jsh.shell.environment.SLIME_TEST_NO_DOCKER) fifty.load("../rhino/tools/docker/module.fifty.ts");
			fifty.load("../rhino/tools/github/module.fifty.ts");
			if (hasGit) fifty.load("../rhino/tools/git/module.fifty.ts");
			fifty.load("../rhino/tools/gcloud/module.fifty.ts");
			fifty.load("../rhino/tools/jenkins/module.fifty.ts");
			fifty.load("../rhino/tools/maven/module.fifty.ts");
			fifty.load("../jrunscript/jsh/suite.fifty.ts");
			fifty.load("../jrunscript/jsh/launcher/suite.fifty.ts");
			if (isMkcertImplemented) fifty.load("../jrunscript/jsh/test/remote.fifty.ts");
			fifty.load("../jrunscript/jsh/loader/jsh.fifty.ts");
			fifty.load("../jrunscript/jsh/script/plugin.jsh.fifty.ts");
			if (isMkcertImplemented) fifty.load("../loader/api/old/jsh/plugin.jsh.web.fifty.ts");
			fifty.load("../jrunscript/jsh/tools/suite.fifty.ts");
			fifty.load("../jrunscript/jsh/tools/install/plugin.jsh.fifty.ts");

			fifty.load("../rhino/http/servlet/suite.fifty.ts");
			fifty.load("../rhino/ui/application.fifty.ts");

			fifty.load("../tools/code/module.fifty.ts");
			fifty.load("../tools/fifty/module.fifty.ts");

			//	TODO	For reasons that are baffling, merely loading this file (even though all its tests are conditionally
			//			disabled) seems to cause issue #896
			if (false) fifty.load("../tools/wf/plugin.jsh.fifty.ts");
			if (hasGit && isGitClone) fifty.load("../tools/wf/plugin-standard.jsh.fifty.ts");
			if (hasGit && isGitClone) fifty.load("../wf.fifty.ts");
			//	TODO	below test is probably pointless, probably doesn't run anything. Should we find a way to short-circuit it?
			if (!jsh.shell.environment.SLIME_TEST_NO_BROWSER) fifty.load("../loader/browser/test/suite.jsh.fifty.ts");
		}
	}
//@ts-ignore
)(fifty);
