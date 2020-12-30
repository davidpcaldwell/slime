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
import java.util.*;

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

		void attach(org.mozilla.javascript.tools.debugger.Dim dim) {
			dim.attachTo(factory);
		}

		Object call(ContextAction action) {
			@SuppressWarnings("unchecked")
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
					this.classes = Loader.Classes.create(new Loader.Classes.Configuration() {
						@Override public boolean canCreateClassLoaders() {
							return Configuration.this.canCreateClassLoaders();
						}

						@Override public ClassLoader getApplicationClassLoader() {
							return (Configuration.this.getApplicationClassLoader() == null) ? ContextFactory.class.getClassLoader() : Configuration.this.getApplicationClassLoader();
						}

						@Override public File getLocalClassCache() {
							return Configuration.this.getLocalClassCache();
						}
					});
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
	public Object execute(Program program) {
		Outcome outcome = (Outcome)configuration.call(new ProgramAction(this, program, debugger));
		return outcome.getResult();
	}

	public static abstract class Value {
		public static Value create(final Object o) {
			return new Value() {
				public Object get(Context context, Scriptable scope) {
					return Context.javaToJS(o, scope);
				}
			};
		}

		public abstract Object get(Context context, Scriptable scope);
	}

	private static Object variable_getValue(Value value, Context context, Scriptable scope) {
		return value.get(context, scope);
	}

	private static int getRhinoAttributes(Program.DataPropertyDescriptor variable) {
		return Engine.toRhinoAttributes(variable);
	}

	static void scope_set(Context context, Scriptable global, Program.DataPropertyDescriptor variable) {
		ScriptableObject.defineProperty(
			global,
			variable.getName(),
			variable_getValue(Value.create(variable.value()), context, global),
			getRhinoAttributes(variable)
		);
	}

	static void variable_set(Program.DataPropertyDescriptor variable, Context context, Scriptable global) {
		Engine.scope_set(context, global, variable);
	}

	static class Outcome {
		private Object result;

		Outcome(Object result) {
			this.result = result;
		}

		Object getResult() {
			return result;
		}
	}

	private static Outcome execute(Program program, Debugger dim, Context context, Scriptable global) throws IOException {
		if (context == null) {
			throw new RuntimeException("'context' is null");
		}
		Object result = null;
		for (int i=0; i<program.sources().size(); i++) {
			Errors errors = Errors.get(context);
			if (errors != null) {
				errors.reset();
			}
			try {
				SourceUnit unit = new SourceUnit(program.sources().get(i));
				result = unit.execute(dim, context, global);
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
		return new Outcome(result);
	}

	private static Outcome interpret(Program program, Debugger dim, Context context, Scriptable global) throws IOException {
		if (context == null) {
			throw new RuntimeException("'context' is null");
		}
		return execute(program, dim, context, global);
	}

	static abstract class Unit {
		protected abstract Object execute(Debugger dim, Context context, Scriptable global) throws IOException;
	}

	private static class SourceUnit extends Unit {
		private Source source;

		SourceUnit(Source source) {
			this.source = source;
		}

		protected Object execute(Debugger dim, Context context, Scriptable global) throws IOException {
			return source.evaluate(dim, context, global, global, true);
		}
	}

	static int toRhinoAttributes(Program.DataPropertyDescriptor attributes) {
		int rv = ScriptableObject.EMPTY;
		if (!attributes.configurable()) rv |= ScriptableObject.PERMANENT;
		if (!attributes.writable()) rv |= ScriptableObject.READONLY;
		if (!attributes.enumerable()) rv |= ScriptableObject.DONTENUM;
		return rv;
	}

	private static class ProgramAction implements ContextAction {
		private Engine engine;
		private Program program;
		private Debugger debugger;

		ProgramAction(Engine engine, Program program, Debugger debugger) {
			this.engine = engine;
			this.program = program;
			this.debugger = debugger;
		}

		private void setVariablesInGlobalScope(Program program, Context context, Scriptable global) {
			List<Program.DataPropertyDescriptor> variables = program.variables();
			for (int i=0; i<variables.size(); i++) {
				Program.DataPropertyDescriptor v = variables.get(i);
				Object value = Value.create(v.value()).get(context, global);

				//	Deal with dumb Rhino restriction that we use object arrays only
				if (value instanceof Object[]) {
					Object[] array = (Object[])value;
					Object[] objects = new Object[array.length];
					for (int j=0; j<objects.length; j++) {
						objects[j] = array[j];
					}
					value = context.newArray( global, objects );
				}

				variable_set(v, context, global);
			}
		}

		public Object run(Context context) {
			try {
				Scriptable global = engine.getGlobalScope(context);
				setVariablesInGlobalScope(program, context, global);
				debugger.initialize(global, engine, program);
				Outcome outcome = interpret(program, debugger, context, global);
				return outcome;
			} catch (java.io.IOException e) {
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