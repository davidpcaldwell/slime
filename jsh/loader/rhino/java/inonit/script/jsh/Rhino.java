//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import javax.script.*;

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

		public boolean canAccessEnvironment() {
			return engine.canAccessEnvironment();
		}

		public Loader.Classes.Interface getClasspath() {
			return engine.getClasses().getInterface();
		}

		public Debugger getDebugger() {
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
			Integer rv = ExecutionImpl.execute(subshell, engine, log, subinterface());
			engine.getDebugger().setBreakOnExceptions(breakOnExceptions);
			return (rv == null) ? 0 : rv.intValue();
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
		static Integer execute(Shell shell, Engine rhino, Engine.Log log, Interface $rhino) throws Shell.Invocation.CheckedException {
			ExecutionImpl execution = new ExecutionImpl(shell, rhino, log, $rhino);
			return execution.execute();
		}

		private Engine engine;
		private Engine.Log log;
		private Interface $rhino;

		ExecutionImpl(Shell shell, Engine engine, Engine.Log log, Interface $rhino) {
			super(shell);
			this.engine = engine;
			this.log = log;
			this.$rhino = $rhino;
		}

		@Override public void setJshRuntimeObject(Host.Program program) {
			program.bind("$rhino", $rhino);
			program.run(this.getJshLoaderFile("rhino.js"));
		}

		@Override protected Host.Factory getHostFactory() {
			return engine.getHostFactory();
		}

		@Override protected Loader.Classes getClasses() {
			return engine.getClasses();
		}

		private ErrorHandlingImpl errorHandling = new ErrorHandlingImpl();

		@Override public ErrorHandling getErrorHandling() {
			return errorHandling;
		}

		private class ErrorHandlingImpl extends ErrorHandling {
			@Override
			public Integer run(Run r) {
				try {
					r.run();
					return null;
				} catch (ExitError e) {
					return Integer.valueOf(e.getStatus());
				} catch (Errors e) {
					LOG.log(Level.INFO, "Engine.Errors thrown.", e);
					Errors.ScriptError[] errors = e.getErrors();
					LOG.log(Level.FINER, "Engine.Errors length: %d", errors.length);
					LOG.log(Level.FINE, "Logging errors to %s.", log);
					e.dump(log, "[jsh] ");
					return -1;
				} catch (ScriptException e) {
					throw new RuntimeException("Should be unreachable in Rhino", e);
				} finally {
					$rhino.destroy();
				}
			}
		}
	}

	public static abstract class Configuration {
		public abstract int getOptimizationLevel();
		public abstract Debugger getDebugger();

		//	TODO	consider: should this log implementation be supplied, and just log to stderr?
		public abstract Engine.Log getLog();

		private Engine engine;

		final void initialize(final Shell.Environment shell) {
			this.engine = Engine.create(
				Configuration.this.getDebugger(),
				new Engine.Configuration() {
					@Override public Loader.Classes.Configuration getClassesConfiguration() {
						return shell.getClassesConfiguration();
					}

					@Override public boolean canAccessEnvironment() {
						return true;
					}

					@Override public int getOptimizationLevel() {
						return Configuration.this.getOptimizationLevel();
					}
				}
			);
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

				public Debugger getDebugger() {
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
						return Debugger.RhinoDebugger.create(new Debugger.RhinoDebugger.Configuration() {
							public Debugger.RhinoDebugger.Ui.Factory getUiFactory() {
								return Gui.RHINO_UI_FACTORY;
							}
						});
					} else if (id.equals("profiler")) {
						return new Debugger.Profiler();
					} else if (id.startsWith("profiler:")) {
						return new Debugger.Profiler();
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

	private Rhino() {
	}

	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	static class ExitError extends Error {
		private int status;

		ExitError(int status) {
			this.status = status;
		}

		int getStatus() {
			return status;
		}
	}

	public static class EngineImpl extends Shell.Engine {
		private static void run(Shell shell) {
			final Configuration engineConfiguration = Configuration.main(shell.getEnvironment());
			try {
				java.util.concurrent.ExecutorService service = java.util.concurrent.Executors.newSingleThreadExecutor();
				java.util.concurrent.Future<Integer> future = service.submit(new java.util.concurrent.Callable<Integer>() {
					public Integer call() throws Exception {
						engineConfiguration.initialize(shell.getEnvironment());
						return ExecutionImpl.execute(shell, engineConfiguration.getEngine(), engineConfiguration.getLog(), new Interface(shell, engineConfiguration.getEngine(), engineConfiguration.getLog()));
					}
				});
				Integer status = future.get();
				service.shutdown();
				if (status != null) {
					LOG.log(Level.INFO, "Exiting via provided exit status %d.", status);
					shell.getEnvironment().exit(status.intValue());
				} else {
					Set<Thread> threads = Thread.getAllStackTraces().keySet();
					LOG.log(Level.INFO, "No exit status provided; destroying debugger (if any). JVM will exit when threads complete.", status);
					java.util.function.Function<Thread,Boolean> isAwt = (t) -> t.getName().startsWith("AWT-");
					for (Thread t : threads) {
						if (t != null && t != Thread.currentThread() && !t.isDaemon() && !isAwt.apply(t)) {
							LOG.log(Level.FINER, "Active thread: " + t + " daemon = " + t.isDaemon());
							t.join();
						}
					}
					engineConfiguration.getEngine().getDebugger().destroy();
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
				shell.getEnvironment().exit(1);
			} finally {

			}
		}

		public void main(Shell shell) {
			run(shell);
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
