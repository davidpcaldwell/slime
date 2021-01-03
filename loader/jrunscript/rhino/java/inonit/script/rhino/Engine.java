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

		/**
		 * Creates the single <code>ClassLoader</code> to be used for this {@link Engine}. Currently all {@link Context}s created
		 * by an <code>Engine</code> share the same <code>ClassLoader</code>.
		 *
		 * @return A <code>ClassLoader</code>, or <code>null</code> to use the ClassLoader that loaded Rhino.
		 */
		public abstract ClassLoader getApplicationClassLoader();

		public abstract File getLocalClassCache();

		public abstract boolean canAccessEnvironment();
		public abstract int getOptimizationLevel();

		final Loader.Classes.Configuration toClassesConfiguration() {
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

		private ContextFactoryInner factory = new ContextFactoryInner();

		final ContextFactory factory() {
			return factory;
		}

		final synchronized Context getContext() {
			return Context.getCurrentContext();
		}

		final Loader.Classes getClasses() {
			return factory.getClasses();
		}

		void attach(org.mozilla.javascript.tools.debugger.Dim dim) {
			dim.attachTo(factory);
		}

		private class ContextFactoryInner extends ContextFactory {
			private Loader.Classes classes;

			ContextFactoryInner() {
			}

			private boolean initialized = false;

			private synchronized void initializeClassLoaders() {
				if (!initialized) {
					this.classes = Loader.Classes.create(toClassesConfiguration());
					initialized = true;
				}
			}

			private synchronized ClassLoader getContextApplicationClassLoader() {
				initializeClassLoaders();
				return this.classes.getApplicationClassLoader();
			}

			final Loader.Classes getClasses() {
				initializeClassLoaders();
				return this.classes;
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
		rv.hosts = new HostFactory(debugger, contexts.factory());
		return rv;
	}

	private Debugger debugger;
	private Configuration configuration;
	private HostFactory hosts;

	private Engine() {
	}

	//	TODO	it would be nice if this returned the evaluation value of the script, but according to interactive testing,
	//			it does not; it always returns null, because source.evaluate always returns undefined, even for an expression.
	//	TODO	can this be unified with the Host.Script construct? Can Source be unified with it?
	public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
		Source source = Source.create(name,code);
		Object rv = source.evaluate(debugger, configuration, scope, target);
		if (rv instanceof Scriptable) return (Scriptable)rv;
		return null;
	}

	public boolean canAccessEnvironment() {
		return configuration.canAccessEnvironment();
	}

	public Host.Factory getHostFactory() {
		return hosts;
	}

	public Loader.Classes getClasses() {
		return configuration.getClasses();
	}

	//	Used from servlet implementation to simplify usage given that it relies both on the Host.Factory and Loader.Classes from
	//	this object
	public Object execute(Host.Program program) {
		try {
			return Host.run(hosts, configuration.getClasses(), program);
		} catch (javax.script.ScriptException e) {
			throw new RuntimeException(e);
		}
	}

	public Debugger getDebugger() {
		return this.debugger;
	}

	//	TODO	note that this implementation ignores the ClassLoader specified to its create() method, instead relying on
	//			the single ContextFactory classloader
	private static class HostFactory extends Host.Factory {
		private Debugger debugger;
		private ContextFactory contexts;

		HostFactory(Debugger debugger, ContextFactory contexts) {
			this.debugger = debugger;
			this.contexts = contexts;
		}

		@Override
		public Host create(ClassLoader classes) {
			return new ExecutorImpl(debugger, contexts);
		}

		private static class ExecutorImpl extends Host {
			private Debugger dim;
			private ContextFactory contexts;

			private Context context;
			private Scriptable global;

			ExecutorImpl(Debugger dim, ContextFactory contexts) {
				this.dim = dim;
				this.contexts = contexts;
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

			@Override public void initialize() {
				this.context = contexts.enterContext();
				this.global = context.initStandardObjects();
			}

			@Override public void destroy() {
				Context.exit();
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

			private static class Unit {
				private Source source;

				Unit(Source source) {
					this.source = source;
				}

				protected Object execute(Debugger dim, Context context, Scriptable global) throws IOException {
					return source.evaluate(dim, context, global, global, true);
				}
			}
		}
	}
}