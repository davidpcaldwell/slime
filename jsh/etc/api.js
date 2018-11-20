//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	//	Used by:
	//		jsh/etc/build.jsh.js: to determine what modules to build
	//			things with jsh.module or (.api|.test) and .module are built
	//			things with jsh.module.javac or (.api|.test) and module.javac are compiled
	//	TODO	remove content that used to drive browser tests
	var components = new function() {
		var byEnvironment = {
			browser: [],
			jsh: []
		}

		this.add = function(path,p) {
			if (p.jsh) {
				p.jsh.path = path;
				byEnvironment.jsh.push(p.jsh);
			}
			if (p.browser) {
				p.browser.path = path;
				byEnvironment.browser.push(p.browser);
			}
			if (p.api || p.test) {
				p.path = path;
				byEnvironment.browser.push(p);
				byEnvironment.jsh.push(p);
			}
		}

		this.environment = function(name) {
			return byEnvironment[name];
		}
	}

	components.add("loader/", { api: true });
	components.add("loader/api/", { api: true, module: true });
	components.add("loader/api/unit.js", { test: true });
	components.add("loader/test/data/a/", { api: false, module: true });
	components.add("js/object/", { api: true, jsh: { module: true }});
	components.add("js/object/Error.js", { test: true });
	components.add("js/document/", { api: true, jsh: { module: true }});
	components.add("js/web/", { browser: { api: true }, jsh: { api: false, module: true }});
	components.add("js/time/", { api: true, module: true });
	components.add("loader/api/test/data/1/", { api: true });
	components.add("loader/browser/", { browser: { api: true }});

	components.add("js/debug/", { jsh: { module: true }});

	components.add("loader/jrunscript/", { jsh: { api: true }});
	//	TODO	loader/jrunscript/java has some tests
	//	TODO	loader/jrunscript/test/data/2/ has some tests but they require some classes in classpath
	//	TODO	rhino/io/mime.api.html has some tests

	components.add("jrunscript/host/", { jsh: { api: true, module: { javac: true }}});
	components.add("rhino/file/", { jsh: { api: true, module: { javac: true }}});
	//	Servlet module has Java classes but we do not compile them here
	//	servlet classes are provided by webapp.jsh.js when building a webapp, and classpath with servlet API is supplied by invoker
	["rhino/io/","rhino/document/","rhino/shell/","jsh/script/","rhino/http/client/","rhino/http/servlet/","rhino/ip/"].forEach(function(path) {
		components.add(path, { jsh: { api: true, module: true }});
	});
	components.add("rhino/tools/", { jsh: { api: false, module: true }});
	components.add("rhino/http/servlet/plugin.jsh.api.html", { jsh: { api: true } });
	components.add("rhino/ui/", { jsh: { api: false, module: { javac: true } } });

	/*modules.add("rhino/mail/", "jsh.mail");*/

	components.add("jsh/loader/loader.api.html", { jsh: { api: true } });
	components.add("rhino/shell/plugin.jsh.api.html", { jsh: { api: true } });
	components.add("jsh/launcher/", { jsh: { api: true } });
	components.add("jsh/loader/plugin.api.html", { jsh: { api: true } });
	components.add("jsh/unit/", { jsh: { api: true, module: true } });

//	components.add("jsh/tools/", { jsh: { api: true } });
	components.add("jsh/tools/install/", { jsh: { api: true, module: true } });

	return components;
})()