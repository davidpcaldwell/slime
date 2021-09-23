//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.test {
	export type service = (request: any, response: any) => void

	export type Servlet = {
		set: (implementation: service) => void
		service: service
	}

	export type Scope = {
		servlet: Servlet
		tomcat: any
		$Context: any
		context: any
		module: slime.jrunscript.http.client.Exports
		Cookie: any
		skip: any
		getServerRequestCookies: (request: any) => {
			name: string
			value: string
		}[]
		hasDefaultCookieHandler: boolean
	}

	export type Fixtures = {
		(
			Packages: slime.jrunscript.Packages,
			JavaAdapter: any,
			jsh: slime.jsh.Global,
			$jsapi: {
				environment: { [x: string]: any },
				loader: slime.Loader
			},
			scope: Scope
		): void
	}

	(
		function($export: slime.loader.Export<slime.jrunscript.http.client.test.Fixtures>) {
			$export(
				function(
					Packages: slime.jrunscript.Packages,
					JavaAdapter: any,
					jsh: slime.jsh.Global,
					$jsapi: {
						environment: { [x: string]: any },
						loader: slime.Loader
					},
					scope: Scope
				) {
					var TOMCAT_CLASS = jsh.java.getClass("org.apache.catalina.startup.Tomcat");
					var CATALINA_HOME = (function() {
						if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
						if (jsh.shell.jsh.lib && jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
					})();
					if (!TOMCAT_CLASS && CATALINA_HOME) {
						[
							"bin/tomcat-juli.jar", "lib/servlet-api.jar", "lib/tomcat-util.jar", "lib/tomcat-api.jar", "lib/tomcat-coyote.jar",
							"lib/catalina.jar"
							,"lib/annotations-api.jar"
						].forEach(function(path) {
							jsh.loader.java.add(CATALINA_HOME.getRelativePath(path));
						});
						TOMCAT_CLASS = jsh.java.getClass("org.apache.catalina.startup.Tomcat");
					}

					var tomcatPresent = Boolean(TOMCAT_CLASS);
					var global = (function() { return this; })();
					var tomcat;
					var servlet;
					var port;
					if (!scope.tomcat && !$jsapi.environment.windowsSocketsError10106 && tomcatPresent) {
						tomcat = new Packages.org.apache.catalina.startup.Tomcat();
						servlet = new function() {
							var implementation;

							this.set = function(f) {
								implementation = f;
							}

							this.service = function(request,response) {
								implementation.call(this,request,response);
							}
						};

						port = (function() {
							var address = new Packages.java.net.ServerSocket(0);
							var rv = address.getLocalPort();
							address.close();
							return rv;
						})();

						(function() {
							var base = jsh.shell.TMPDIR.createTemporary({ directory: true });
							tomcat.setPort(port);
							tomcat.setBaseDir(base);
							var context = tomcat.addContext("/", base.pathname.java.adapt().getCanonicalPath());
							Packages.org.apache.catalina.startup.Tomcat.addServlet(context,"aName",new JavaAdapter(
								Packages.javax.servlet.http.HttpServlet,
								servlet
							));
							context.addServletMapping("/*","aName");
							tomcat.start();
						})();
						global.tomcat = tomcat;
						global.servlet = servlet;
					} else {
						tomcat = global.tomcat;
						servlet = global.servlet;
					}

					var Cookie = Packages.javax.servlet.http.Cookie;

					scope.$Context = function(gae) {
						var js = $jsapi.loader.module("../../../js/object/");
						var java = $jsapi.loader.module("../../../jrunscript/host/", {
							$slime: jsh.unit.$slime,
							logging: {
								prefix: "slime.jrunscript.http.client.test"
							}
						});
						var io = $jsapi.loader.module("../../../jrunscript/io/", {
							api: {
								java: java,
								mime: jsh.unit.$slime.mime
							},
							//	TODO	huh? See below
			//				$java: new Packages.inonit.script.runtime.io.Streams(),
							$slime: jsh.unit.$slime
						});

						this.api = {
							js: js,
							java: java,
							io: io,
							web: $jsapi.loader.module("../../../js/web/", {
								escaper: $jsapi.loader.file("../../../js/web/context.java.js")
							})
						};
						this.io = io;
						this.port = port;
						this.gae = gae;
					};

			//		if (false) {
			//			if (tomcat) {
			////				return [ new $Context(false), new $Context(true) ];
			//				throw new Error();
			//				return null;
			//			} else {
			//				var context = new $Context(false);
			//				context.notomcat = true;
			//				return [ context ];
			//			}
			//		} else {
						var context = new scope.$Context(false);
						context.notomcat = !Boolean(tomcat);
						scope.servlet = servlet;
						scope.tomcat = tomcat;
						scope.context = context;
						scope.module = $jsapi.loader.module("module.js", context);
			//		}
					scope.Cookie = Packages.javax.servlet.http.Cookie;
					scope.skip = function(verify,message) {
						if (typeof(verify) == "string") {
							jsh.shell.console("DEPRECATED: skip(string) in api.html");
							return {
								success: true,
								messages: {
									success: "SKIP: " + verify
								}
							}
						}
						if (!message) message = "Skipping: no Tomcat";
						verify(message).is(message);
					};
					scope.getServerRequestCookies = function(request) {
						if (request.getCookies() === null) return [];
						return jsh.java.Array.adapt(request.getCookies()).filter(function(_cookie) {
							return String(_cookie.getName()) != "JSESSIONID";
						}).map(function(_cookie) {
							return { name: String(_cookie.getName()), value: String(_cookie.getValue()) }
						});
					};
					scope.hasDefaultCookieHandler = Boolean(Packages.java.net.CookieHandler.getDefault());
		}
			);
		//@ts-ignore
		}($export)
	)
}