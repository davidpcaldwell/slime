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
			if (p.api) {
				p.path = path;
				byEnvironment.browser.push(p);
				byEnvironment.jsh.push(p);
			}
		}

		this.environment = function(name) {
			return byEnvironment[name];
		}
	}

	var modules = new function() {
		var list = [];

		this.add = function(o) {
			list.push(o);
		};

		this.array = list;
	};

	var Module = function(path,configuration) {
		if (configuration.api) {
			this.api = { path: path };
		}
		if (configuration.module) {
			this.module = { path: path.substring(0,path.length-1) };
			for (var x in configuration.module) {
				this.module[x] = configuration.module[x];
			}
		}
	}
	components.add("loader/", { api: true });
	components.add("loader/api/", { api: true });
	components.add("js/object/", { api: true, jsh: { module: true }});
	components.add("js/object/Error.js", { api: true });
	components.add("js/document/", { api: true, jsh: { module: true }});
	components.add("js/web/", { browser: { api: true }, jsh: { api: false, module: true }});
	components.add("loader/api/test/data/1/", { api: true });
	components.add("loader/browser/", { browser: { api: true }});

	components.add("js/mime/", { browser: { api: true }, jsh: { module: true }});
	components.add("js/debug/", { jsh: { module: true }});

	components.add("loader/rhino/", { jsh: { api: true }});
	//	TODO	browser currently runs loader/rhino/test/data/1/
	//	TODO	loader/test/data/coffee/ used to be run when testing Rhino and I believe browser

	components.add("rhino/host/", { jsh: { api: true, module: { javac: true }}});
	components.add("rhino/file/", { jsh: { api: true, module: { javac: true }}});
	//	Servlet module has Java classes but we do not compile them here
	//	servlet classes are provided by webapp.jsh.js when building a webapp, and classpath with servlet API is supplied by invoker
	["rhino/io/","rhino/document/","rhino/shell/","jsh/script/","rhino/http/client/","rhino/http/servlet/"].forEach(function(path) {
		components.add(path, { jsh: { api: true, module: true }});
	});
	components.add("rhino/http/servlet/plugin.jsh.api.html", { jsh: { api: true } });

	components.add("rhino/tools/", { jsh: { api: false, module: true }});
	/*modules.add("rhino/mail/", "jsh.mail");*/

	components.add("jsh/loader/loader.api.html", { jsh: { api: true } });
	components.add("rhino/shell/jsh.js", { jsh: { api: true } });
	components.add("jsh/launcher/rhino/", { jsh: { api: true } });
	components.add("jsh/loader/plugin.api.html", { jsh: { api: true } });
	components.add("jsh/tools/", { jsh: { api: true } });
	components.add("jsh/unit/", { jsh: { api: true } });

	return components;
})()