//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.servlet;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.util.logging.*;

import inonit.script.engine.*;

final class ServletCore {
	private static final Logger LOG = Logger.getLogger(ServletCore.class.getName());

	static {
		Class<?>[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Java loader depends on them
			inonit.script.runtime.Throwables.class
		};
	}

	interface Adapter {
		ClassLoader getClassLoader();
		Class<?> getServletContextClass();
		InputStream getResourceAsStream(String path);
		Object getServletContext();
		Object getServletConfig();
		String getPathInfo(Object request);
		Script adapt(Object script);
	}

	static abstract class Script {
		public abstract void service(Object request, Object response);
		public abstract void destroy();
	}

	private final Adapter adapter;
	private Script script;

	ServletCore(Adapter adapter) {
		this.adapter = adapter;
	}

	static abstract class ScriptContainer {
		private inonit.script.engine.Host.Program program = new inonit.script.engine.Host.Program();

		private Loader.Classes.Configuration classes = new Loader.Classes.Configuration() {
			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public ClassLoader getApplicationClassLoader() {
				return ServletCore.class.getClassLoader();
			}

			@Override public File getLocalClassCache() {
				return null;
			}
		};

		abstract void initialize(ServletCore servlet);

		protected final Loader.Classes.Configuration getLoaderClassesConfiguration() {
			return classes;
		}

		abstract Servlet.HostObject getServletHostObject();

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

	final Script script() {
		return script;
	}

	private boolean hasClass(String name) {
		try {
			adapter.getClassLoader().loadClass(name);
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
			return (ScriptContainer)adapter.getClassLoader().loadClass("inonit.script.servlet." + engine)
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

	void init() {
		ScriptContainer container = createScriptContainer();
		container.initialize(this);
		container.setVariable("$host", container.getServletHostObject());
		container.addScript(
			Code.Loader.Resource.create(
				Code.Loader.URI.jvm(adapter.getServletContextClass(), "WEB-INF/api.js"),
				"WEB-INF/api.js",
				null,
				null,
				adapter.getResourceAsStream("/WEB-INF/api.js")
			)
		);
		container.execute();
	}

	void destroy() {
		script.destroy();
	}

	void service(Object request, Object response) {
		LOG.log(Level.INFO, "Executing request %s ...", adapter.getPathInfo(request));
		script.service(request, response);
	}

	static abstract class HostObject {
		private ServletCore servlet;
		private Loader loader;

		HostObject(final ServletCore servlet) {
			this.servlet = servlet;
			this.loader = new inonit.script.engine.Loader() {
				private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

				@Override public String getCoffeeScript() throws IOException {
					InputStream code = servlet.adapter.getResourceAsStream("/WEB-INF/lib/coffee-script.js");
					if (code == null) return null;
					return streams.readString(code);
				}

				@Override public String getLoaderCode(String path) throws IOException {
					return streams.readString(servlet.adapter.getResourceAsStream("/WEB-INF/loader/" + path));
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

		public void register(Object script) {
			LOG.log(Level.CONFIG, "Initialized servlet with script " + script);
			servlet.script = servlet.adapter.adapt(script);
		}

		public Loader getLoader() {
			return this.loader;
		}

		public Object getServletContext() {
			return servlet.adapter.getServletContext();
		}

		public Object getServletConfig() {
			return servlet.adapter.getServletConfig();
		}
	}
}
