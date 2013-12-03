//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.servlet;

import java.io.*;
import java.util.*;

import javax.servlet.http.*;

import org.mozilla.javascript.*;

import inonit.script.rhino.*;

public class Servlet extends javax.servlet.http.HttpServlet {
	static {
		Class[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Rhino loader depends on them
			inonit.script.rhino.Objects.class
			,inonit.script.rhino.MetaObject.class
			//	Pull these in as dependencies, since servlets load the rhino/host module, which includes these classes
			//	Currently, webapp.jsh.js is unaware of modules and just copies them into the WEB-INF/slime directory, expecting
			//	them to be loaded by its bootstrap loader
			,inonit.script.runtime.Throwables.class
			,inonit.script.runtime.Properties.class
		};
	}

	private Script script;

	public static abstract class Script {
		public abstract void service(HttpServletRequest request, HttpServletResponse response);
		public abstract void destroy();
	}

	@Override public final void init() {
		Engine.Debugger debugger = null;
		if (System.getenv("SLIME_SCRIPT_DEBUGGER") != null && System.getenv("SLIME_SCRIPT_DEBUGGER").equals("rhino")) {
			Engine.RhinoDebugger.Configuration configuration = new Engine.RhinoDebugger.Configuration() {
				@Override public Engine.RhinoDebugger.Ui.Factory getUiFactory() {
					return inonit.script.rhino.Gui.RHINO_UI_FACTORY;
				}				
			};
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

		program.add(Engine.Source.create("<api.js>", getServletContext().getResourceAsStream("/WEB-INF/api.js")));

		try {
			System.err.println("Executing JavaScript program ...");
			engine.execute(program);
			System.err.println("Executed program: script = " + script);
		} catch (Engine.Errors errors) {
			System.err.println("Caught errors.");
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
		System.err.println("Executing request ...");
		script.service(request, response);
	}

	public class Host {
		private Scriptable rhinoLoader;

		Host(Engine engine) {
			try {
				this.rhinoLoader = inonit.script.rhino.Loader.load(engine, new inonit.script.rhino.Loader() {
					private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

					@Override public String getPlatformCode() throws IOException {
						return streams.readString(getServletContext().getResourceAsStream("/WEB-INF/loader.platform.js"));
					}

					@Override public String getRhinoCode() throws IOException {
						return streams.readString(getServletContext().getResourceAsStream("/WEB-INF/loader.rhino.js"));
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

		public Map<String,String> getServletInitParameters() {
			Map<String,String> rv = new HashMap<String,String>();
			Enumeration<String> e = getServletConfig().getInitParameterNames();
			for (String k : Collections.list(e)) {
				rv.put(k, getServletConfig().getInitParameter(k));
			}
			return rv;
		}

		public String getMimeType(String path) {
			return getServletConfig().getServletContext().getMimeType(path);
		}
	}
}