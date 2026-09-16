//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.servlet;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.util.logging.*;

import javax.servlet.*;
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
		private inonit.script.engine.Host.Program program = new inonit.script.engine.Host.Program();

		private Loader.Classes.Configuration classes = new Loader.Classes.Configuration() {
			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public ClassLoader getApplicationClassLoader() {
				return Servlet.class.getClassLoader();
			}

			@Override public File getLocalClassCache() {
				return null;
			}
		};

		abstract void initialize(Servlet servlet);

		protected final Loader.Classes.Configuration getLoaderClassesConfiguration() {
			return classes;
		}

		abstract HostObject getServletHostObject();

		final void setVariable(String name, Object value) {
			program.bind(Host.Binding.create(name, value));
		}

		final void addScript(Code.Loader.Resource resource) {
			try {
				program.run(Host.Script.create(resource));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		final void execute() {
			execute(program);
		}

		abstract void execute(inonit.script.engine.Host.Program program);
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
			//	Method used in Java 8. By Java 11, it had been deprecated. However, I think the replacement (explicitly invoking the
			//	no-argument constructor) works in JDK 8. Going to try it
			return (ScriptContainer)getClass().getClassLoader().loadClass("inonit.script.servlet." + engine)
				.getDeclaredConstructor().newInstance()
			;
		} catch (
			InstantiationException
			| ClassNotFoundException
			| IllegalAccessException
			| NoSuchMethodException
			| InvocationTargetException
			e
		) {
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

		public ServletContext getServletContext() {
			return servlet.getServletContext();
		}

		public ServletConfig getServletConfig() {
			return servlet.getServletConfig();
		}
	}
}
