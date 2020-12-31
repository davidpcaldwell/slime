//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.rhino;

import java.io.*;

import javax.script.*;

import org.mozilla.javascript.*;

import inonit.script.engine.*;

public class Engine {
	public static abstract class Log {
		public static final Log NULL = new Log() {
			public void println(String message) {
			}
		};

		public abstract void println(String message);

		public final void println() {
			println("");
		}
	}

	public static abstract class Configuration {
		public static final Configuration DEFAULT = new Configuration() {
			@Override public ClassLoader getApplicationClassLoader() {
				return null;
			}

			@Override public File getLocalClassCache() {
				return null;
			}

			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public boolean canAccessEnvironment() {
				return true;
			}

			@Override public int getOptimizationLevel() {
				return -1;
			}
		};

		@Override public String toString() {
			return getClass().getName() + " factory=" + factory;
		}

		public abstract boolean canCreateClassLoaders();
		public abstract boolean canAccessEnvironment();

		/**
		 * Creates the single <code>ClassLoader</code> to be used for this {@link Engine}. Currently all {@link Context}s created
		 * by an <code>Engine</code> share the same <code>ClassLoader</code>.
		 *
		 * @return A <code>ClassLoader</code>, or <code>null</code> to use the ClassLoader that loaded Rhino.
		 */
		public abstract ClassLoader getApplicationClassLoader();

		public abstract File getLocalClassCache();
		public abstract int getOptimizationLevel();

		private ContextFactoryInner factory = new ContextFactoryInner();

		final ContextFactory factory() {
			return factory;
		}

		final synchronized Context getContext() {
			return Context.getCurrentContext();
		}

		final Loader.Classes.Interface getClasspath() {
			return factory.getClasspath();
		}

		final Loader.Classes.Configuration classes() {
			return new Loader.Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return Configuration.this.canCreateClassLoaders();
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return (Configuration.this.getApplicationClassLoader() == null) ? ContextFactory.class.getClassLoader() : Configuration.this.getApplicationClassLoader();
				}

				@Override public File getLocalClassCache() {
					return Configuration.this.getLocalClassCache();
				}
			};
		}

		void attach(org.mozilla.javascript.tools.debugger.Dim dim) {
			dim.attachTo(factory);
		}

		Object call(ContextAction action) {
			Object rv = factory.call(action);
			return rv;
		}

		private class ContextFactoryInner extends ContextFactory {
			private Loader.Classes classes;

			ContextFactoryInner() {
			}

			private boolean initialized = false;

			private synchronized void initializeClassLoaders() {
				if (!initialized) {
					this.classes = Loader.Classes.create(classes());
					initialized = true;
				}
			}

			private synchronized ClassLoader getContextApplicationClassLoader() {
				initializeClassLoaders();
				return this.classes.getApplicationClassLoader();
			}

			final Loader.Classes.Interface getClasspath() {
				initializeClassLoaders();
				return this.classes.getInterface();
			}

			@Override protected synchronized Context makeContext() {
				Context rv = super.makeContext();
				rv.setApplicationClassLoader(getContextApplicationClassLoader());
				rv.setErrorReporter(new Errors().getErrorReporter());
				rv.setOptimizationLevel(getOptimizationLevel());
				return rv;
			}

			@Override protected boolean hasFeature(Context context, int feature) {
				if (feature == Context.FEATURE_STRICT_VARS) {
					return true;
				} else if (feature == Context.FEATURE_STRICT_EVAL) {
					return true;
				}
				return super.hasFeature(context, feature);
			}
		}

		public String getImplementationVersion() {
			Context context = getContext();
			if (context == null) {
				Context.enter();
				String rv = getContext().getImplementationVersion();
				Context.exit();
				return rv;
			} else {
				return context.getImplementationVersion();
			}
		}

		public org.mozilla.javascript.xml.XMLLib.Factory getRhinoE4xImplementationFactory() {
			Context context = getContext();
			if (context == null) {
				Context.enter();
				org.mozilla.javascript.xml.XMLLib.Factory rv = getContext().getE4xImplementationFactory();
				Context.exit();
				return rv;
			} else {
				return context.getE4xImplementationFactory();
			}
		}
	}

	public static Engine create(Debugger debugger, Configuration contexts) {
		Engine rv = new Engine();
		if (debugger == null) {
			debugger = new Debugger.NoDebugger();
		}
		rv.debugger = debugger;
		rv.configuration = contexts;
		debugger.initialize(contexts);
		return rv;
	}

	private Debugger debugger;
	private Configuration configuration;

	private Engine() {
	}

	private Scriptable getGlobalScope(Context context) {
		return context.initStandardObjects();
	}

	//	TODO	it would be nice if this returned the evaluation value of the script, but according to interactive testing,
	//			it does not; it always returns null, because source.evaluate always returns undefined, even for an expression.
	public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
		Source source = Source.create(name,code);
		Object rv = source.evaluate(debugger, configuration, scope, target);
		if (rv instanceof Scriptable) return (Scriptable)rv;
		return null;
	}

	public boolean canAccessEnvironment() {
		return configuration.canAccessEnvironment();
	}

	//	Used from servlet and jsh Java implementations
	public Object execute(Host.Program program) {
		return configuration.call(new ProgramAction(this, program, debugger));
	}

	static class Unit {
		private Source source;

		Unit(Source source) {
			this.source = source;
		}

		protected Object execute(Debugger dim, Context context, Scriptable global) throws IOException {
			return source.evaluate(dim, context, global, global, true);
		}
	}

	private static Object toScopePropertyValue(Context context, Scriptable global, Object value) {
		if (value instanceof Object[]) {
			Object[] array = (Object[])value;
			Object[] objects = new Object[array.length];
			for (int j=0; j<objects.length; j++) {
				objects[j] = array[j];
			}
			return context.newArray( global, objects );
		}
		return Context.javaToJS(value, global);
	}

	private static int toRhinoAttributes(Host.Binding attributes) {
		int rv = ScriptableObject.EMPTY;
		rv |= ScriptableObject.PERMANENT;
		rv |= ScriptableObject.READONLY;
		rv |= ScriptableObject.DONTENUM;
		return rv;
	}

	private static class ExecutorImpl extends Host.Executor {
		private Debugger dim;
		private Context context;
		private Scriptable global;

		ExecutorImpl(Engine engine, Debugger dim, Context context) {
			this.dim = dim;
			this.context = context;
			this.global = engine.getGlobalScope(context);
		}

		@Override
		public void bind(Host.Binding binding) {
			ScriptableObject.defineProperty(
				global,
				binding.getName(),
				toScopePropertyValue(context, global, binding.getValue()),
				toRhinoAttributes(binding)
			);
		}

		@Override
		public Object eval(Host.Script file) {
			//	TODO	probably as we move toward javax.script, the caught errors should report out as ScriptException
			Errors errors = Errors.get(context);
			if (errors != null) {
				errors.reset();
			}
			try {
				Unit unit = new Unit(Source.create(file));
				return unit.execute(dim, context, global);
			} catch (IOException e) {
				//	TODO	could use some analysis here about what this exception would mean
				throw new RuntimeException(e);
			} catch (WrappedException e) {
				//	TODO	Note that when this is merged into jsh, we will need to change jsh error reporting to dump the
				//			stack trace from the contained Throwable inside the errors object.
//					throw e;
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			} catch (EvaluatorException e) {
				//	TODO	Oh my goodness, is there no better way to do this?
				if (errors != null && (e.getMessage().indexOf("Compilation produced") == -1 || e.getMessage().indexOf("syntax errors.") == -1)) {
					errors.add(e);
				}
				if (errors != null) {
					throw errors;
				} else {
					throw e;
				}
			} catch (EcmaError e) {
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			} catch (JavaScriptException e) {
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			}
		}
	}

	private static class HostFactory extends Host.Factory {
		private Engine engine;
		private Debugger debugger;
		private Context context;

		HostFactory(Engine engine, Debugger debugger, Context context) {
			this.engine = engine;
			this.debugger = debugger;
			this.context = context;
		}

		@Override
		public Host.Executor create(ClassLoader classes) {
			return new ExecutorImpl(engine, debugger, context);
		}
	}

	private static class ProgramAction implements ContextAction {
		private Engine engine;
		private Host.Program program;
		private Debugger debugger;

		ProgramAction(Engine engine, Host.Program program, Debugger debugger) {
			this.engine = engine;
			this.program = program;
			this.debugger = debugger;
		}

		public Object run(Context context) {
			Host.Factory factory = new HostFactory(engine, debugger, context);
			Host host = Host.create(factory, engine.configuration.classes());
			try {
				return host.run(program);
			} catch (ScriptException e) {
				//	can't happen right now, it is believed, though could refactor so that other exceptions are thrown as these
				//	to standardize across engines
				throw new RuntimeException(e);
			}
		}
	}

	public Debugger getDebugger() {
		return this.debugger;
	}

	public Loader.Classes.Interface getClasspath() {
		return this.configuration.getClasspath();
	}
}