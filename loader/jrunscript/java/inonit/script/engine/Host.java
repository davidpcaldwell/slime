package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;

import javax.script.*;

import inonit.script.runtime.io.*;

/**
 * A {@link Host} is an object capable of executing scripts within a global scope, with an arbitrary set of values provided as
 * to that scope (called "bindings" in the javax.script API).
 */
public abstract class Host {
	private static final Streams streams = new inonit.script.runtime.io.Streams();

	public static abstract class Script {
		public abstract URI getURI();
		public abstract String getName();
		public abstract String getCode();

		public static Script create(final Code.Loader.Resource resource) throws IOException {
			final String code = streams.readString(resource.getReader());
			return new Script() {
				@Override
				public String toString() {
					return resource.getURI().adapt().toString();
				}

				@Override
				public URI getURI() {
					return resource.getURI().adapt();
				}

				@Override
				public String getName() {
					return resource.getSourceName();
				}

				public String getCode() {
					return code;
				}
			};
		}
	}

	public static abstract class Binding {
		public abstract String getName();
		public abstract Object getValue();

		public static Binding create(final String name, final Object value) {
			return new Binding() {
				@Override
				public String getName() {
					return name;
				}

				@Override
				public Object getValue() {
					return value;
				}
			};
		}
	}

	private static class JavaxScriptHost extends Host {
		private ScriptEngineManager factory;
		private ScriptEngine engine;

		private JavaxScriptHost(String engineName) {
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName(engineName);
			if (this.engine == null) {
				throw new RuntimeException("No engine: " + engineName + " in " + System.getProperty("java.home"));
			}
		}

		public void initialize() {}
		public void destroy() {}

		public void bind(Binding binding) {
			factory.getBindings().put(binding.getName(), binding.getValue());
		}

		public Object eval(Script file) throws ScriptException {
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, file.getName(), ScriptContext.ENGINE_SCOPE);
			return engine.eval(file.getCode(), c);
		}
	}

	public static abstract class Factory {
		public abstract Host create(ClassLoader classes);

		public static Factory engine(final String name) {
			return new Factory() {
				public Host create(ClassLoader classes) {
					Thread.currentThread().setContextClassLoader(classes);
					return new JavaxScriptHost(name);
				}
			};
		}
	}

	private static Object run(Host executor, Program program) throws ScriptException {
		for (Binding binding : program.variables()) {
			executor.bind(binding);
		}
		Object rv = null;
		for (Script script : program.scripts()) {
			rv = executor.eval(script);
		}
		return rv;
	}

	public static Object run(Factory factory, Loader.Classes classes, Program program) throws ScriptException {
		Host executor = factory.create(classes.getApplicationClassLoader());
		executor.initialize();
		try {
			return run(executor, program);
		} finally {
			executor.destroy();
		}
	}

	protected Host() {
	}

	protected abstract void initialize();
	protected abstract void destroy();
	protected abstract void bind(Binding binding);
	protected abstract Object eval(Script file) throws ScriptException;

	public static class Program {
		private ArrayList<Binding> variables = new ArrayList<Binding>();
		private ArrayList<Script> scripts = new ArrayList<Script>();

		public void bind(Binding variable) {
			variables.add( variable );
		}

		public void bind(String name, Object value) {
			bind(Binding.create(name, value));
		}

		final List<Binding> variables() {
			return variables;
		}

		/**
		 * Adds the given script to the program.
		 * @param script
		 */
		public void run(Script script) {
			scripts.add(script);
		}

		/**
		 * Creates a script from the given resource and adds it to the program.
		 * @param script
		 */
		public void run(Code.Loader.Resource resource) {
			try {
				run(Script.create(resource));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		final List<Script> scripts() {
			return scripts;
		}
	}
}