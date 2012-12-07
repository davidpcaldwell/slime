//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import javax.servlet.http.*;

import org.mozilla.javascript.*;

import inonit.script.rhino.*;

public class Servlet extends javax.servlet.http.HttpServlet {
	static {
		Class dependency = inonit.script.rhino.Objects.class;
	}

	private Script script;

	public static abstract class Script {
		public abstract void service(HttpServletRequest request, HttpServletResponse response);
		public abstract void destroy();
	}

	@Override public final void init() {
		Engine.Debugger debugger = null;
		if (System.getenv("SLIME_SCRIPT_DEBUGGER") != null && System.getenv("SLIME_SCRIPT_DEBUGGER").equals("rhino")) {
			Engine.RhinoDebugger.Configuration configuration = new Engine.RhinoDebugger.Configuration();
			configuration.setExit(new Runnable() {
				public void run() {
				}
			});
			configuration.setLog(new Engine.Log() {
				@Override public void println(String message) {
					System.err.println(message);
				}
			});
			debugger = Engine.RhinoDebugger.create(configuration);
		}
		Engine engine = Engine.create(debugger, Engine.Configuration.DEFAULT);

		Engine.Program program = new Engine.Program();

		try {
			Engine.Program.Variable jsh = Engine.Program.Variable.create(
				"$host",
				Engine.Program.Variable.Value.create(new Host(engine))
			);
			jsh.setReadonly(true);
			jsh.setPermanent(true);
			jsh.setDontenum(true);
			program.set(jsh);
		} catch (Engine.Errors errors) {
			errors.dump(
				new Engine.Log() {
					@Override
					public void println(String message) {
						System.err.println(message);
					}
				},
				"[slime] "
			);
			throw errors;
		}

		program.add(Engine.Source.create("<api.js>", getServletContext().getResourceAsStream("WEB-INF/api.js")));

		try {
			engine.execute(program);
		} catch (Engine.Errors errors) {
			errors.dump(
				new Engine.Log() {
					@Override
					public void println(String message) {
						System.err.println(message);
					}
				},
				"[slime] "
			);
			throw errors;
		}
	}

	@Override public final void destroy() {
		script.destroy();
	}

	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
		script.service(request, response);
	}

	public class Host {
		private Scriptable rhinoLoader;

		Host(Engine engine) {
			try {
				this.rhinoLoader = inonit.script.rhino.Loader.load(engine, new inonit.script.rhino.Loader() {
					private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

					@Override public String getPlatformCode() throws IOException {
						return streams.readString(getServletContext().getResourceAsStream("WEB-INF/loader.platform.js"));
					}

					@Override public String getRhinoCode() throws IOException {
						return streams.readString(getServletContext().getResourceAsStream("WEB-INF/loader.rhino.js"));
					}
				});
			} catch (IOException e) {
				throw new RuntimeException("Could not load Slime rhino loader.", e);
			}
		}

		public void register(Script script) {
			Servlet.this.script = script;
		}

		public Scriptable getRhinoLoader() throws IOException {
			return this.rhinoLoader;
		}

		public Code.Source getServletResources() {
			try {
				return Code.Source.create(getServletConfig().getServletContext().getResource("/"));
			} catch (java.net.MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public String getServletScriptPath() {
			return getServletConfig().getInitParameter("script");
		}
	}
}