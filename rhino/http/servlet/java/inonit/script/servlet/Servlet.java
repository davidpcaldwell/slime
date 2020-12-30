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
import java.util.logging.*;

import javax.servlet.http.*;

import inonit.script.engine.*;

public class Servlet extends javax.servlet.http.HttpServlet {
	private static final Logger LOG = Logger.getLogger(Servlet.class.getName());

	static {
		Class<?>[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Java loader depends on them
			inonit.script.runtime.Throwables.class
		};
	}

	private Script script;

	public static abstract class Script {
		public abstract void service(HttpServletRequest request, HttpServletResponse response);
		public abstract void destroy();
	}

	static abstract class ScriptContainer {
		abstract void initialize(Servlet servlet);
		abstract HostObject getServletHostObject();
		abstract void setVariable(String name, Object value);
		abstract void addScript(Code.Loader.Resource resource);
		abstract void execute();
	}

	protected final Script script() {
		return script;
	}

	private boolean hasClass(String name) {
		try {
			Servlet.class.getClassLoader().loadClass(name);
			return true;
		} catch (ClassNotFoundException e) {
			return false;
		}
	}

	private ScriptContainer createScriptContainer() {
		String engine = null;
		boolean hasRhino = hasClass("org.mozilla.javascript.Context");
		boolean hasNashorn = new javax.script.ScriptEngineManager().getEngineByName("nashorn") != null;
		if (!hasRhino && !hasNashorn) {
			//	TODO	think through
			throw new RuntimeException("Missing Rhino classes and Nashorn engine.");
		} else if (hasRhino && !hasNashorn) {
			engine = "Rhino";
		} else if (!hasRhino && hasNashorn) {
			engine = "Nashorn";
		} else {
			engine = "Rhino";
		}
		try {
			return (ScriptContainer)getClass().getClassLoader().loadClass("inonit.script.servlet." + engine).newInstance();
		} catch (InstantiationException e) {
			throw new RuntimeException(e);
		} catch (ClassNotFoundException e) {
			throw new RuntimeException(e);
		} catch (IllegalAccessException e) {
			throw new RuntimeException(e);
		}
	}

	@Override public final void init() {
		ScriptContainer container = createScriptContainer();
		container.initialize(this);
		container.setVariable("$host", container.getServletHostObject());
		container.addScript(
			Code.Loader.Resource.create(
				Code.Loader.URI.jvm(javax.servlet.ServletContext.class, "WEB-INF/api.js"),
				"WEB-INF/api.js",
				null,
				null,
				getServletContext().getResourceAsStream("/WEB-INF/api.js")
			)
		);
		container.execute();
	}

	@Override public final void destroy() {
		script.destroy();
	}

	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
		LOG.log(Level.INFO, "Executing request %s ...", request.getPathInfo());
		script.service(request, response);
	}

	public static abstract class HostObject {
		private Servlet servlet;
		private Loader loader;

		HostObject(final Servlet servlet) {
			this.servlet = servlet;
			this.loader = new inonit.script.engine.Loader() {
				private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

				@Override public String getCoffeeScript() throws IOException {
					InputStream code = servlet.getServletContext().getResourceAsStream("/WEB-INF/lib/coffee-script.js");
					if (code == null) return null;
					return streams.readString(code);
				}

				@Override public String getLoaderCode(String path) throws IOException {
					return streams.readString(servlet.getServletContext().getResourceAsStream("/WEB-INF/loader/" + path));
				}

				@Override public Typescript getTypescript() {
					return null;
				}

				@Override public Loader.Classes.Interface getClasspath() {
					return HostObject.this.getClasspath();
				}
			};
		}

		abstract Loader.Classes.Interface getClasspath();

		public void register(Script script) {
			LOG.log(Level.CONFIG, "Initialized servlet with script " + script);
			servlet.script = script;
		}

		public Loader getLoader() {
			return this.loader;
		}

		public Servlet getServlet() {
			return servlet;
		}
	}
}