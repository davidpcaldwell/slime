//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(function() {
	tests.rhino = {
		modules: [
			{
				path: "db/jdbc/"
				,classpath: [{
					getClasspath: function() {
						return jsh.file.Searchpath([environment.mysql.current.driver]);
					}
				}]
			}
		],
		environment: (environment && environment.mysql && environment.mysql.jsapi) ? environment.mysql.jsapi.environment : null
	};

	//	To test: run application (which launches index page), log in, then press "Run unit tests"
	slim.applications.firebase = {
		resources: "db/firebase/slim/test/resources.js",
		configuration: "WEB-INF/db/firebase/slim/test/configuration.js",
		parameters: {
			debug: "true"
		}
	}

	//api.db = {
	//	modules: [
	//		{
	//			name: "Derby",
	//			path: "db/jdbc/derby/"
	//		}
	//	]
	//};

	code.add({
		name: "jdbc",
		path: "db/jdbc/"
	});
	code.add({
		name: "derby",
		path: "db/jdbc/derby/"
	});
	//code.add(new code.Module({
	//	name: "postgresql",
	//	path: "db/jdbc/postgresql/"
	//}));
})();
