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

import inonit.script.runtime.io.*;
import inonit.system.*;
import inonit.script.engine.*;
import inonit.script.rhino.*;

public class Rhino {
	private static class ExecutionImpl extends Shell.Execution {
		private Engine engine;
		private Interface $rhino;
		private Streams streams = new Streams();

		ExecutionImpl(Engine engine, Interface $rhino) {
			this.engine = engine;
			this.$rhino = $rhino;
		}

		private Engine.Program program = new Engine.Program();

		@Override public void host(String name, Object value) {
			Engine.Program.Variable variable = Engine.Program.Variable.create(
				name,
				Engine.Program.Variable.Value.create(value)
			);
			variable.setReadonly(true);
			variable.setPermanent(true);
			variable.setDontenum(true);
			program.set(variable);
		}

		@Override public void addEngine() {
			host("$rhino", $rhino);
			try {
				script(this.getShell().getJshLoader().getFile("rhino.js"));
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		@Override public void script(Code.Source.File script) {
			program.add(Engine.Source.create(script));
		}

		@Override public Integer execute() {
			engine.execute(program);
			return null;
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
					if (System.getProperty("jsh.rhino.optimization") != null) {
						//	TODO	validate this value
						optimization = Integer.parseInt(System.getProperty("jsh.rhino.optimization"));
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
									Logging.get().log(Rhino.class, Level.INFO, "Swallowing AWT exception assumed to be caused by debugger.", e);
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
							Logging.get().log(Rhino.class, Level.FINER, "Logging: " + message + " to System.err ...");
							((PrintStream)shell.getStdio().getStandardError()).println(message);
						}
					};
				}
			};
		}
	}

	private Shell shell;

	private Configuration rhino;

	private Rhino() {
	}

	private Integer run() throws Shell.Invocation.CheckedException {
		this.rhino = Configuration.main(shell.getEnvironment());

		Integer rv = Rhino.execute(
			shell,
			this.rhino
		);

		return rv;
	}

	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	public static Integer execute(Shell shell, Rhino.Configuration rhino) throws Shell.Invocation.CheckedException {
		rhino.initialize(shell.getEnvironment());
		return Rhino.execute(shell, rhino, new Interface(shell, rhino));
	}

	private static Integer execute(Shell shell, Configuration rhino, Interface $rhino) throws Shell.Invocation.CheckedException {
		try {
			ExecutionImpl execution = new ExecutionImpl(rhino.getEngine(), $rhino);
			Integer ignore = execution.execute(shell);
			return null;
		} catch (ExitError e) {
			return new Integer(e.getStatus());
		} catch (Engine.Errors e) {
			Logging.get().log(Shell.class, Level.INFO, "Engine.Errors thrown.", e);
			Engine.Errors.ScriptError[] errors = e.getErrors();
			Logging.get().log(Shell.class, Level.FINER, "Engine.Errors length: %d", errors.length);
			Logging.get().log(Shell.class, Level.FINE, "Logging errors to %s.", rhino.getLog());
			e.dump(rhino.getLog(), "[jsh] ");
			return -1;
		} finally {
			$rhino.destroy();
		}
	}

//	public static Scriptable load(Installation installation, Shell.Environment configuration, Rhino.Configuration rhino, Invocation invocation) {
//		return Host.create(installation, configuration, rhino, invocation).load();
//	}

	static class ExitError extends Error {
		private int status;

		ExitError(int status) {
			this.status = status;
		}

		int getStatus() {
			return status;
		}
	}

	public static class Interface {
		private Shell shell;
		private Configuration rhino;
		private Engine.Debugger debugger;
		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		Interface(Shell shell, Rhino.Configuration rhino) {
			this.shell = shell;
			this.rhino = rhino;
			this.debugger = rhino.getEngine().getDebugger();
		}

		private Interface(Shell shell, Rhino.Configuration rhino, Engine.Debugger debugger) {
			this.shell = shell;
			this.rhino = rhino;
			this.debugger = debugger;
		}

		//	TODO	can this level of indirection surrounding debugger be removed?

		public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
			return rhino.getEngine().script(name, code, scope, target);
		}

		public Loader.Classes.Interface getClasspath() {
			return rhino.getEngine().getClasspath();
		}

		public Engine.Debugger getDebugger() {
			return debugger;
		}

		public void exit(int status) {
			debugger.setBreakOnExceptions(false);
			throw new ExitError(status);
		}

		private Interface subinterface() {
			//	TODO	provide separate classloader for child script
			return new Interface(shell,rhino,debugger);
		}

		public int jsh(final Shell.Environment configuration, final Shell.Invocation invocation) throws IOException, Shell.Invocation.CheckedException {
			boolean breakOnExceptions = debugger.isBreakOnExceptions();
			Shell subshell = shell.subshell(configuration, invocation);
			Integer rv = Rhino.execute(subshell, this.rhino, subinterface());
			debugger.setBreakOnExceptions(breakOnExceptions);
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
					rhino.getLog().println("Error running finalizer: " + finalizers.get(i));
				}
			}
		}
	}

//	private static void exit(int status) {
//		System.exit(status);
//	}

	private class Run implements Runnable {
		public Integer call() throws Shell.Invocation.CheckedException {
			return Rhino.this.run();
		}

		private Integer result;
		private Throwable threw;

		public Integer result() throws Throwable {
			if (threw != null) throw threw;
			return result;
		}

		public void run() {
			try {
				result = call();
			} catch (Throwable e) {
				threw = e;
			}
		}
	}

	public static class EngineImpl extends Main.Engine {
		private static void run(Shell.Container context, Shell shell) {
			Rhino main = new Rhino();
			main.shell = shell;
			try {
	//			Integer status = java.util.concurrent.Executors.newCachedThreadPool().submit(main.new Run()).get();
				Run run = main.new Run();
				Thread thread = new Thread(run);
				thread.setName("Loader");
				thread.start();
				thread.join();
				Integer status = run.result();
	//			Integer status = main.run();
				Logging.get().log(Rhino.class, Level.INFO, "Exiting normally with status %d.", status);
				if (status != null) {
					context.exit(status.intValue());
				} else {
					main.rhino.getEngine().getDebugger().destroy();
					//	JVM will exit normally when non-daemon threads complete.
				}
			} catch (Shell.Invocation.CheckedException e) {
				Logging.get().log(Rhino.class, Level.INFO, "Exiting with checked exception.", e);
				System.err.println(e.getMessage());
				context.exit(1);
			} catch (Throwable t) {
				Logging.get().log(Rhino.class, Level.SEVERE, "Exiting with throwable.", t);
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

	public static Main.Engine engine() {
		return new EngineImpl();
	}

	public static void main(String[] args) throws Throwable {
		Logging.get().log(Rhino.class, Level.INFO, "Invoked main(String[] args) with " + args.length + " arguments.");
		for (int i=0; i<args.length; i++) {
			Logging.get().log(Rhino.class, Level.INFO, "Argument " + i + " is: " + args[i]);
		}
		Logging.get().log(Rhino.class, Level.INFO, "loader jsh.plugins=" + System.getProperty("jsh.plugins"));
		engine().cli(args);
	}
}