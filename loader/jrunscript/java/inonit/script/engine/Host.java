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
public class Host {
	private static final Streams streams = new inonit.script.runtime.io.Streams();

	public static abstract class Script {
		public abstract URI getURI();
		public abstract String getName();
		public abstract String getCode();

		public static Script create(final Code.Loader.Resource resource) throws IOException {
			final String code = streams.readString(resource.getReader());
			return new Script() {
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

	public static abstract class Executor {
		public abstract void bind(Binding binding);
		public abstract Object eval(Script file) throws ScriptException;
	}

	private static class ExecutorImpl extends Executor {
		private ScriptEngineManager factory;
		private ScriptEngine engine;

		private ExecutorImpl(String engineName) {
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName(engineName);
			if (this.engine == null) {
				throw new RuntimeException("No engine: " + engineName + " in " + System.getProperty("java.home"));
			}
		}

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
		public abstract Executor create();

		public static Factory engine(final String name) {
			return new Factory() {
				public Executor create() {
					return new ExecutorImpl(name);
				}
			};
		}
	}

	public static Host create(Factory factory, Loader.Classes.Configuration configuration) {
		Loader.Classes classes = Loader.Classes.create(configuration);
		Thread.currentThread().setContextClassLoader(classes.getApplicationClassLoader());
		Executor executor = factory.create();
		Host rv = new Host();
		rv.initialize(executor, classes);
		return rv;
	}

	private Executor executor;
	private Loader.Classes classes;
	private List<Script> scripts = new ArrayList<Script>();

	private Host() {
	}

	final void initialize(Executor executor, Loader.Classes classes) {
		this.executor = executor;
		this.classes = classes;
	}

	public void bind(Binding binding) {
		executor.bind(binding);
	}

	public void script(Script script) throws IOException {
		if (script == null) throw new NullPointerException("Attempt to add null script.");
		scripts.add(script);
	}

	public Loader.Classes.Interface getClasspath() {
		return classes.getInterface();
	}

	//	TODO	what about IOException?
	public Object run() throws ScriptException {
		Object rv = null;
		for (Script file : scripts) {
			rv = executor.eval(file);
		}
		return rv;
	}
}