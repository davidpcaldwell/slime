$exports.Tomcat = function(p) {	
	this.Base = function(pp) {
		(function() {
			if (pp.configuration) {
				//	pp.configuration is file
				pp.configuration.copy(pp.base.getRelativePath("conf/server.xml"), { recursive: true });
			}
			pp.base.getRelativePath("logs").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			pp.base.getRelativePath("temp").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			pp.base.getRelativePath("webapps").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});		
		})();
		
		var catalina = function(command,m) {
			return function() {
				jsh.shell.shell(
					jsh.file.Pathname("/bin/sh"),
					[
						p.home.getRelativePath("bin/catalina.sh"),
						command
					],
					{
						environment: jsh.js.Object.set({}, jsh.shell.environment, {
							//	Strip trailing slashes from path names, which appear to confuse catalina.sh
							//	TODO	see if it works without the stripping
							CATALINA_BASE: pp.base.toString().substring(0,pp.base.toString().length-1),
							CATALINA_HOME: p.home.toString().substring(0,p.home.toString().length-1),
							SLIME_SCRIPT_DEBUGGER: (m && m.debug && m.debug.script) ? "rhino" : "none"
						}),
						onExit: function(result) {
							jsh.shell.echo("Executed " + command + " with status: " + result.status);
						}
					}
				);
			}
		};
		
		var started = false;
	
		this.start = function(m) {
			jsh.shell.echo("Starting server at " + p.home + " with base " + pp.base + " ...");

			new jsh.java.Thread(catalina("run",m)).start();
			started = true;
		}		
	
		this.stop = function() {
			if (started) {
				catalina("stop")();
			}
		}
	}
}
