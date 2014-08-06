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
	modules.add({ api: { path: "jsh/launcher/rhino/" } });
	modules.add({ api: { path: "jsh/loader/plugin.api.html" } });
	modules.add({ api: { path: "jsh/tools/" } });
	modules.add({ api: { path: "loader/api/" } });
	modules.add({ api: { path: "jsh/unit/" } });
	modules.add({ api: { path: "jsh/loader/loader.api.html" } });
	modules.add({ api: { path: "loader/" } });
	modules.add({ api: { path: "loader/rhino/" } });
	modules.add({ api: { path: "loader/test/data/a/" } });
	modules.add({ api: { path: "loader/test/data/b/" } });
	modules.add({ api: { path: "loader/test/data/c/main.js" } });
	modules.add({ api: { path: "loader/test/data/coffee/" } });
	modules.add(new Module("js/object/", { api: true, module: true }));
	modules.add(new Module("js/mime/", { api: false, module: true }));
	modules.add(new Module("js/web/", { api: false, module: true }));
	modules.add(new Module("js/debug/", { api: false, module: true }));
	modules.add(new Module("rhino/host/", { api: true, module: { javac: true } }));
	modules.add(new Module("rhino/io/", { api: true, module: true }));
	modules.add(new Module("js/document/", { api: true, module: true }));
	modules.add(new Module("rhino/document/", { api: true, module: true }));
	modules.add(new Module("rhino/file/", { api: true, module: { javac: true } }));
	modules.add(new Module("rhino/shell/", { api: true, module: true }));
	modules.add({ api: { path: "rhino/shell/jsh.js" } });
	modules.add(new Module("jsh/script/", { api: true, module: true }));
	modules.add(new Module("rhino/http/client/", { api: true, module: true }));
	modules.add(new Module("rhino/tools/", { api: false, module: true }));
	//	Servlet module has Java classes but we do not compile them here
	//	servlet classes are provided by webapp.jsh.js when building a webapp, and classpath with servlet API is supplied by invoker
	modules.add(new Module("rhino/http/servlet/", { api: true, module: true }));
	modules.add({ api: { path: "rhino/http/servlet/plugin.jsh.api.html" } });
	/*modules.add("rhino/mail/", "jsh.mail");*/
	return modules.array;
})()