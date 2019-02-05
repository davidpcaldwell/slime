package inonit.script.engine;

import java.util.*;

import javax.script.*;

public class Host {
	public static abstract class Executor {
		public abstract void set(String name, Object value);
		public abstract Object eval(Code.Loader.Resource file) throws ScriptException;
	}

	private static class ExecutorImpl extends Executor {
		private ScriptEngineManager factory;
		private ScriptEngine engine;

		private ExecutorImpl(String engineName) {
			this.factory = new ScriptEngineManager();
			this.engine = factory.getEngineByName(engineName);
		}

		public void set(String name, Object value) {
			factory.getBindings().put(name, value);
		}

		public Object eval(Code.Loader.Resource file) throws ScriptException {
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, file.getSourceName(), ScriptContext.ENGINE_SCOPE);
			return engine.eval(file.getReader(), c);
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
	private List<Code.Loader.Resource> scripts = new ArrayList<Code.Loader.Resource>();

	private Host() {
	}

	final void initialize(Executor executor, Loader.Classes classes) {
		this.executor = executor;
		this.classes = classes;
	}

	public void set(String name, Object value) {
		executor.set(name, value);
	}

	public void add(Code.Loader.Resource script) {
		scripts.add(script);
	}

	public Loader.Classes.Interface getClasspath() {
		return classes.getInterface();
	}

	//	TODO	what about IOException?
	public Object run() throws ScriptException {
		Object rv = null;
		for (Code.Loader.Resource file : scripts) {
			rv = executor.eval(file);
		}
		return rv;
	}
}