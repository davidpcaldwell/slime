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

			//	Allows the suite to be split into a fixed number of roughly time-balanced "shards" that can be run as separate,
			//	parallel CI jobs, reducing wall-clock latency (at the cost of some duplicated fixed overhead -- Docker build, JDK
			//	install, etc. -- per shard). When unset, all shards run, preserving the original monolithic behavior (e.g., for
			//	local development via `wf test.jrunscript`).
			//
			//	Shard assignment below was derived from real per-file timing data captured from a recent CI run (see
			//	contributor/jrunscript-shards.md) and is intentionally hardcoded rather than computed dynamically, so that shard
			//	membership is stable and reviewable. It should be periodically rebalanced as the suite's timing profile changes.
			var shard = (function() {
				var specified = jsh.shell.environment.SLIME_TEST_JRUNSCRIPT_SHARD;
				if (!specified) return null;
				var number = Number(specified);
				if (!(number >= 1 && number <= 3)) throw new TypeError("SLIME_TEST_JRUNSCRIPT_SHARD must be 1-3; was: " + specified);
				return number;
			})();

			//	Returns true if the given shard number's tests should run in this invocation: either no sharding is in effect
			//	(`shard` is null), or this file's assigned shard matches the requested shard.
			var runsShard = function(assigned) {
				return (shard === null || shard == assigned);
			};

			//	TODO	expression.fifty.ts, particularly in the realm of $api.platform, has engine-specific stuff; would be good to
			//			test it per-engine
			if (runsShard(1)) fifty.load("../loader/expression.fifty.ts");

			if (runsShard(2)) fifty.load("../loader/jrunscript/expression.fifty.ts");
			if (runsShard(2)) fifty.load("../loader/api/verify.fifty.ts");
			if (runsShard(2)) fifty.load("../loader/api/old/unit.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/system/test/Packages.inonit.system.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/system/java/inonit/script/runtime/io/Streams.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/jrunscript/api.fifty.ts");
			if (hasJsoup && runsShard(2)) fifty.load("../loader/document/module.fifty.ts");
			if (runsShard(3)) fifty.load("../js/document/module.fifty.ts");
			if (runsShard(3)) fifty.load("../js/web/module.fifty.ts");
			if (runsShard(3)) fifty.load("../js/codec/ini.fifty.ts");
			if (runsShard(3)) fifty.load("../js/time/module.fifty.ts");
			if (runsShard(1)) fifty.load("../js/object/module.fifty.ts");
			if (runsShard(2)) fifty.load("../jrunscript/host/module.fifty.ts");
			if (runsShard(1)) fifty.load("../jrunscript/io/module.fifty.ts");
			if (runsShard(2)) fifty.load("../jrunscript/io/plugin.jsh.fifty.ts");
			if (runsShard(2)) fifty.load("../jrunscript/tools/install/module.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/document/plugin.jsh.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/ip/module.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/http/client/module.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/file/module.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/shell/module.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/shell/browser/module.fifty.ts");
			if (runsShard(1)) fifty.load("../jrunscript/jsh/shell/plugin.jsh.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/tools/module.fifty.ts");
			if (runsShard(2)) fifty.load("../rhino/tools/plugin.jsh.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/tools/node/module.fifty.ts");
			if (!jsh.shell.environment.SLIME_TEST_NO_DOCKER && runsShard(2)) fifty.load("../rhino/tools/docker/module.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/tools/github/module.fifty.ts");
			if (hasGit && runsShard(2)) fifty.load("../rhino/tools/git/module.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/tools/gcloud/module.fifty.ts");
			if (runsShard(3)) fifty.load("../rhino/tools/jenkins/module.fifty.ts");
			if (runsShard(2)) fifty.load("../rhino/tools/maven/module.fifty.ts");
			if (runsShard(2)) fifty.load("../jrunscript/jsh/suite.fifty.ts");
			if (runsShard(1)) fifty.load("../jrunscript/jsh/launcher/suite.fifty.ts");
			if (isMkcertImplemented && runsShard(3)) fifty.load("../jrunscript/jsh/test/remote.fifty.ts");
			if (runsShard(3)) fifty.load("../jrunscript/jsh/loader/jsh.fifty.ts");
			if (runsShard(2)) fifty.load("../jrunscript/jsh/script/plugin.jsh.fifty.ts");
			if (isMkcertImplemented && runsShard(3)) fifty.load("../loader/api/old/jsh/plugin.jsh.web.fifty.ts");
			if (runsShard(3)) fifty.load("../jrunscript/jsh/tools/suite.fifty.ts");
			if (runsShard(3)) fifty.load("../jrunscript/jsh/tools/install/plugin.jsh.fifty.ts");

			if (runsShard(1)) fifty.load("../rhino/http/servlet/suite.fifty.ts");
			if (runsShard(1)) fifty.load("../rhino/ui/application.fifty.ts");

			if (runsShard(2)) fifty.load("../tools/code/module.fifty.ts");
			if (runsShard(2)) fifty.load("../tools/fifty/module.fifty.ts");

			//	TODO	For reasons that are baffling, merely loading this file (even though all its tests are conditionally
			//			disabled) seems to cause issue #896
			if (false) fifty.load("../tools/wf/plugin.jsh.fifty.ts");

			if (hasGit && isGitClone && runsShard(2)) fifty.load("../tools/wf/plugin-standard.jsh.fifty.ts");
			if (hasGit && isGitClone && runsShard(2)) fifty.load("../wf.fifty.ts");

			//	TODO	below test is probably pointless, probably doesn't run anything. Should we find a way to short-circuit it?
			if (!jsh.shell.environment.SLIME_TEST_NO_BROWSER && runsShard(3)) fifty.load("../loader/browser/test/suite.jsh.fifty.ts");

			if (runsShard(3)) fifty.load("jrunscript-jsapi.fifty.ts");

			if (jsh.shell.environment.SLIME_TEST_JRUNSCRIPT_FAIL) fifty.verify(1).is(2);
		}
	}
//@ts-ignore
)(fifty);
