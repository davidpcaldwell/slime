//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import org.mozilla.javascript.*;

import inonit.script.engine.*;
import inonit.script.rhino.*;

public class Rhino {
	private static final Logger LOG = Logger.getLogger(Rhino.class.getName());

	public static class Interface {
		private Shell shell;
		private Engine engine;
		private Engine.Log log;

		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		Interface(Shell shell, Engine engine, Engine.Log log) {
			this.shell = shell;
			this.engine = engine;
			this.log = log;
		}

		public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
			return engine.script(name, code, scope, target);
		}

		public Loader.Classes.Interface getClasspath() {
			return engine.getClasspath();
		}

		public Engine.Debugger getDebugger() {
			return engine.getDebugger();
		}

		public void exit(int status) {
			engine.getDebugger().setBreakOnExceptions(false);
			throw new ExitError(status);
		}

		private Interface subinterface() {
			//	TODO	provide separate classloader for child script
			return new Interface(shell,engine,log);
		}

		public int jsh(final Shell.Environment configuration, final Shell.Invocation invocation) throws IOException, Shell.Invocation.CheckedException {
			boolean breakOnExceptions = engine.getDebugger().isBreakOnExceptions();
			Shell subshell = shell.subshell(configuration, invocation);
			Integer rv = Rhino.execute(subshell, engine, log, subinterface());
			engine.getDebugger().setBreakOnExceptions(breakOnExceptions);
			if (rv == null) return 0;
			return rv.intValue();
		}

		public void addFinalizer(Runnable finalizer) {
			finalizers.add(finalizer);
		}

		public void destroy() {
			for (int i=0; i<finalizers.size(); i++) {
				try {
					finalizers.get(i).run();
				} catch (Throwable t) {
					//	TODO	log something about the exception
					log.println("Error running finalizer: " + finalizers.get(i));
				}
			}
		}
	}

	private static class ExecutionImpl extends Shell.Execution {
		private Engine engine;
		private Interface $rhino;

		ExecutionImpl(Shell shell, Engine engine, Interface $rhino) {
			super(shell);
			this.engine = engine;
			this.$rhino = $rhino;
		}

		private Engine.Program program = new Engine.Program();

		@Override protected Loader.Classes.Interface getClasspath() {
			return engine.getClasspath();
		}

		@Override public void setGlobalProperty(String name, Object value) {
			Engine.Program.Variable variable = Engine.Program.Variable.create(
				name,
				Engine.Program.Variable.Value.create(value)
			);
			variable.setReadonly(true);
			variable.setPermanent(true);
			variable.setDontenum(true);
			program.set(variable);
		}

		@Override public void setJshHostProperty() {
			setGlobalProperty("$rhino", $rhino);
			try {
				Code.Loader.Resource file = this.getJshLoader().getFile("rhino.js");
				if (file == null) {
					throw new NullPointerException("Expected file rhino.js in " + this.getJshLoader());
				}
				script(file);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		@Override public void script(Code.Loader.Resource script) {
			program.add(Engine.Source.create(script));
		}

		@Override public Integer run() {
			engine.execute(program);
			return null;
		}
	}

	private static Integer execute(Shell shell, Engine rhino, Engine.Log log, Interface $rhino) throws Shell.Invocation.CheckedException {
		try {
			ExecutionImpl execution = new ExecutionImpl(shell, rhino, $rhino);
			Integer ignore = execution.execute();
			return null;
		} catch (ExitError e) {
			return new Integer(e.getStatus());
		} catch (Engine.Errors e) {
			LOG.log(Level.INFO, "Engine.Errors thrown.", e);
			Engine.Errors.ScriptError[] errors = e.getErrors();
			LOG.log(Level.FINER, "Engine.Errors length: %d", errors.length);
			LOG.log(Level.FINE, "Logging errors to %s.", log);
			e.dump(log, "[jsh] ");
			return -1;
		} finally {
			$rhino.destroy();
		}
	}

	public static abstract class Configuration {
		public abstract int getOptimizationLevel();
		public abstract Engine.Debugger getDebugger();

		//	TODO	consider: should this log implementation be supplied, and just log to stderr?
		public abstract Engine.Log getLog();

		private Engine engine;

		final void initialize(final Shell.Environment shell) {
			Engine.Configuration contexts = new Engine.Configuration() {
				@Override public ClassLoader getApplicationClassLoader() {
					return shell.getClassLoader();
				}

				@Override public boolean createClassLoader() {
					return true;
				}

				@Override public File getLocalClassCache() {
					return shell.getClassCache();
				}

				@Override public int getOptimizationLevel() {
					return Configuration.this.getOptimizationLevel();
				}
			};
			this.engine = Engine.create(Configuration.this.getDebugger(), contexts);
		}

		Engine getEngine() {
			return engine;
		}

		static Configuration main(final Shell.Environment shell) {
			return new Configuration() {
				public int getOptimizationLevel() {
					int optimization = -1;
					if (System.getProperty("jsh.engine.rhino.optimization") != null) {
						//	TODO	validate this value
						optimization = Integer.parseInt(System.getProperty("jsh.engine.rhino.optimization"));
					}
					return optimization;
				}

				public Engine.Debugger getDebugger() {
					String id = System.getProperty("jsh.debug.script");
					if (id == null) return null;
					if (id.equals("rhino")) {
						Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
							@Override public void uncaughtException(Thread t, Throwable e) {
								if (t.getName().startsWith("AWT")) {
									//	do nothing
									LOG.log(Level.INFO, "Swallowing AWT exception assumed to be caused by debugger.", e);
								} else {
									System.err.print("Exception in thread \"" + t.getName() + "\"");
									e.printStackTrace();
								}
							}
						});
						return Engine.RhinoDebugger.create(new Engine.RhinoDebugger.Configuration() {
							public Engine.RhinoDebugger.Ui.Factory getUiFactory() {
								return Gui.RHINO_UI_FACTORY;
							}
						});
					} else if (id.equals("profiler")) {
						return new Engine.Profiler();
					} else if (id.startsWith("profiler:")) {
						return new Engine.Profiler();
					} else {
						//	TODO	emit some kind of error?
						return null;
					}
				}

				public Engine.Log getLog() {
					return new Engine.Log() {
						public String toString() { return "Engine.Log: System.err"; }

						public void println(String message) {
							LOG.log(Level.FINER, "Logging: " + message + " to System.err ...");
							((PrintStream)shell.getStdio().getStandardError()).println(message);
						}
					};
				}
			};
		}
	}

	private Shell shell;

	private Configuration engineConfiguration;

	private Rhino(Shell shell) {
		this.shell = shell;
		this.engineConfiguration = Configuration.main(shell.getEnvironment());
	}

	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	private Integer run() throws Shell.Invocation.CheckedException {
		engineConfiguration.initialize(shell.getEnvironment());
		return Rhino.execute(shell, engineConfiguration.getEngine(), engineConfiguration.getLog(), new Interface(shell, engineConfiguration.getEngine(), engineConfiguration.getLog()));
	}

	static class ExitError extends Error {
		private int status;

		ExitError(int status) {
			this.status = status;
		}

		int getStatus() {
			return status;
		}
	}

	public static class EngineImpl extends Main.Engine {
		private static void run(Shell.Container context, Shell shell) {
			final Rhino main = new Rhino(shell);
			try {
				java.util.concurrent.ExecutorService service = java.util.concurrent.Executors.newSingleThreadExecutor();
				java.util.concurrent.Future<Integer> future = service.submit(new java.util.concurrent.Callable<Integer>() {
					public Integer call() throws Exception {
						return main.run();
					}
				});
				Integer status = future.get();
				service.shutdown();
				LOG.log(Level.INFO, "Exiting normally with status %d.", status);
				if (status != null) {
					context.exit(status.intValue());
				} else {
					Thread[] threads = new Thread[Thread.activeCount()*2];
					int count = Thread.enumerate(threads);
					for (Thread t : threads) {
						if (t != null && t != Thread.currentThread() && !t.isDaemon()) {
							LOG.log(Level.FINER, "Active thread: " + t + " daemon = " + t.isDaemon());
							t.join();
						}
					}
					LOG.log(Level.INFO, "Exiting normally with status %d.", status);
					main.engineConfiguration.getEngine().getDebugger().destroy();
					//	JVM will exit normally when non-daemon threads complete.
				}
			} catch (Throwable t) {
				LOG.log(Level.SEVERE, "Exiting with throwable.", t);
				Throwable target = t;
				System.err.println("Error executing " + Rhino.class.getName());
				//	TODO	this error handling can no longer print arguments because they are not passed here, and regardless,
				//			should be handled at a higher level
//				String script = shell.getInvocation().getScript().getUri().toString();
//				String[] args = shell.getInvocation().getArguments();
//				String argsString = script;
//				for (int i=0; i<args.length; i++) {
//					if (i == 0) {
//						argsString += " ";
//					}
//					argsString += args[i];
//					if (i+1 != args.length) {
//						argsString += ",";
//					}
//				}
//				System.err.println("Arguments " + argsString);
				System.err.println("System properties " + System.getProperties().toString());
				System.err.println("Heap size: max = " + Runtime.getRuntime().maxMemory());
				System.err.println("Heap size: free = " + Runtime.getRuntime().freeMemory());
				System.err.println("Stack trace of error:");
				while(target != null) {
					if (target != t) {
						System.err.println("Caused by:");
					}
					System.err.println(target.getClass().getName() + ": " + target.getMessage());
					StackTraceElement[] elements = target.getStackTrace();
					for (int i=0; i<elements.length; i++) {
						StackTraceElement e = elements[i];
						System.err.println("\tat " + e);
					}
					target = target.getCause();
				}
				context.exit(1);
			} finally {

			}
		}

		public void main(Shell.Container context, Shell shell) {
			run(context, shell);
		}
	}

	//	TODO	this is a workaround while we figure out what we want to do with environment-variable settings being passed to
	//			loader
	private static void fixSetting(String name) {
		if (System.getProperty(name) == null) {
			String env = name.replace(".", "_").toUpperCase();
			if (System.getenv(env) != null) {
				System.setProperty(name, System.getenv(env));
			}
		}
	}

	public static void main(String[] args) throws Throwable {
		fixSetting("jsh.engine.rhino.optimization");
		Main.cli(new EngineImpl(), args);
	}
}