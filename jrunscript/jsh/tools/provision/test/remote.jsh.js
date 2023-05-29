//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

jsh.tools.provision.plugin.test();
jsh.test.provision.serve({
	bitbucket: { src: {} },
	base: jsh.shell.jsh.src,
	script: "jsh/tools/provision/test/application.jsh.js"
});
