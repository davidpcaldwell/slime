//	Requires the following plugins in the following order
//	Order is not important if they are in JSH_SCRIPT_CLASSPATH
//
//	$TOMCAT_HOME/bin/tomcat-juli.jar
//	$TOMCAT_HOME/lib/servlet-api.jar
//	$TOMCAT_HOME/lib/tomcat-util.jar
//	$TOMCAT_HOME/lib/tomcat-api.jar
//	$TOMCAT_HOME/lib/tomcat-coyote.jar
//	$TOMCAT_HOME/lib/catalina.jar

plugin({
	isReady: function() {
		return typeof(Packages.org.apache.catalina.startup.Tomcat) == "function";
	},
	load: function() {
		if (!jsh.httpd) {
			jsh.httpd = {};
		}
		jsh.httpd.Tomcat = function(p) {
			var tomcat = new Packages.org.apache.catalina.startup.Tomcat();
			
			var base = (p.base) ? p.base : jsh.shell.TMPDIR.createTemporary({ directory: true, prefix: "tomcat" });

			var port = (p.port) ? p.port : (function() {
				var address = new Packages.java.net.ServerSocket(0);
				var rv = address.getLocalPort();
				address.close();
				return rv;
			})();
			
			this.port = port;

			(function() {
				tomcat.setBaseDir(base);
				tomcat.setPort(port);
				var context = tomcat.addContext("/", base.pathname.java.adapt().getCanonicalPath());
				Packages.org.apache.catalina.startup.Tomcat.addServlet(context,"script",new JavaAdapter(
					Packages.javax.servlet.http.HttpServlet,
					new function() {
						//	TODO	could use jsh.io here
						var _streams = new Packages.inonit.script.runtime.io.Streams();
						var script;
						
						this.init = function() {
							script = jsh.loader.module(p.script, new function() {
							});
						};
						
						var Request = function(_request) {
						}
						
						this.service = function(_request,_response) {
							try {
								var response = script.handle(new Request(_request));
								if (typeof(response) == "undefined") {
									_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
								} else if (response === null) {
									_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_NOT_FOUND);
								} else if (typeof(response) == "object" && response.status && response.headers && response.body) {
									_response.setStatus(response.status.code);
									response.headers.forEach(function(header) {
										_response.addHeader(header.name, header.value);
									});
									if (response.body.type) {
										_response.setContentType(response.body.type);
									}
									if (response.body.string) {
										_response.getWriter().write(response.body.string);
									} else if (response.body.stream) {
										_streams.copy(response.body.stream.java.adapt(),_response.getOutputStream());
										response.body.stream.java.adapt().close();
									}
								}
							} catch (e) {
								_response.sendError(Packages.javax.servlet.http.HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
							}
						}
						
						this.destroy = function() {
							if (script.destroy) {
								script.destroy();
							}
						}
					}
				));
				context.addServletMapping("/*","script");
				tomcat.start();
			})();
		}
	}
});
