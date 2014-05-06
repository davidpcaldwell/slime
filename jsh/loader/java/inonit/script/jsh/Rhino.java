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
			script(this.getShell().getInstallation().getJshLoader("rhino.js"));
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

		final void initialize(final Shell.Configuration shell) {
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
		
		static Configuration main(final Shell.Configuration shell) {
			return new Configuration() {
				public int getOptimizationLevel() {
					int optimization = -1;
					if (System.getProperty("jsh.optimization") != null) {
						//	TODO	validate this value
						optimization = Integer.parseInt(System.getProperty("jsh.optimization"));
					}
					return optimization;
				}

				public Engine.Debugger getDebugger() {
					String id = System.getProperty("jsh.script.debugger");
					if (id == null) return null;
					if (id.equals("rhino")) {
						Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
							@Override
							public void uncaughtException(Thread t, Throwable e) {
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

	private String[] arguments;

	private Configuration rhino;

	private Rhino() {
	}

	private Integer run() throws Invocation.CheckedException {
		Shell shell = Shell.main(arguments);
		
		this.rhino = Configuration.main(shell.getConfiguration());

		Integer rv = Rhino.execute(
			shell,
			this.rhino
		);

		return rv;
	}

	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	public static Integer execute(Shell shell, Rhino.Configuration rhino) throws Invocation.CheckedException {
		rhino.initialize(shell.getConfiguration());
		return Rhino.execute(shell, rhino, new Interface(shell.getInstallation(), rhino));
	}
	
	private static Integer execute(Shell shell, Configuration rhino, Interface $rhino) throws Invocation.CheckedException {
		try {
			ExecutionImpl execution = new ExecutionImpl(rhino.getEngine(), $rhino);
			Object ignore = shell.execute(execution);
			return null;
		} catch (Engine.Errors e) {
			Logging.get().log(Shell.class, Level.INFO, "Engine.Errors thrown.", e);
			Engine.Errors.ScriptError[] errors = e.getErrors();
			Logging.get().log(Shell.class, Level.FINER, "Engine.Errors length: %d", errors.length);
			for (int i=0; i<errors.length; i++) {
				Logging.get().log(Shell.class, Level.FINER, "Engine.Errors errors[%d]: %s", i, errors[i].getThrowable());
				Throwable t = errors[i].getThrowable();
				if (t instanceof WrappedException) {
					WrappedException wrapper = (WrappedException)t;
					if (wrapper.getWrappedException() instanceof ExitException) {
						ExitException exit = (ExitException)wrapper.getWrappedException();
						int status = exit.getStatus();
						Logging.get().log(Shell.class, Level.INFO, "Engine.Errors errors[%d] is ExitException with status %d", i, status);
						Logging.get().log(Shell.class, Level.INFO, "Engine.Errors element stack trace", exit);
						Logging.get().log(Shell.class, Level.INFO, "Script stack trace: %s", wrapper.getScriptStackTrace());
						return status;
					}
				}
			}
			Logging.get().log(Shell.class, Level.FINE, "Logging errors to %s.", rhino.getLog());
			e.dump(rhino.getLog(), "[jsh] ");
			return -1;
		} finally {
			$rhino.destroy();
		}		
	}

//	public static Scriptable load(Installation installation, Shell.Configuration configuration, Rhino.Configuration rhino, Invocation invocation) {
//		return Host.create(installation, configuration, rhino, invocation).load();
//	}
	
	static class ExitException extends Exception {
		private int status;

		ExitException(int status) {
			this.status = status;
		}

		int getStatus() {
			return status;
		}
	}

	public static class Interface {
		private Installation installation;
		private Configuration rhino;
		private Engine.Debugger debugger;
		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();
		
		Interface(Installation installation, Rhino.Configuration rhino) {
			this.installation = installation;
			this.rhino = rhino;
			this.debugger = rhino.getEngine().getDebugger();
		}
		
		private Interface(Installation installation, Rhino.Configuration rhino, Engine.Debugger debugger) {
			this.installation = installation;
			this.rhino = rhino;
			this.debugger = debugger;
		}
		
		//	TODO	can this level of indirection surrounding debugger be removed?
		
		public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
			return rhino.getEngine().script(name, code, scope, target);
		}

		public Loader.Classpath getClasspath() {
			return rhino.getEngine().getClasspath();
		}

		public Engine.Debugger getDebugger() {
			return debugger;
		}

		public void exit(int status) throws ExitException {
			debugger.setBreakOnExceptions(false);
			throw new ExitException(status);
		}
		
		private Interface subinterface() {
			//	TODO	provide separate classloader for child script
			return new Interface(installation,rhino,debugger);
		}

		public int jsh(final Shell.Configuration configuration, final Invocation invocation) throws IOException, Invocation.CheckedException {
			boolean breakOnExceptions = debugger.isBreakOnExceptions();
			Shell subshell = Shell.create(installation, configuration, invocation);
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

	private static void exit(int status) {
		System.exit(status);
	}

	public static void main(String[] args) throws Throwable {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Logging.get().log(Rhino.class, Level.INFO, "Starting script: arguments = %s", Arrays.asList(args));
		Rhino main = new Rhino();
		main.arguments = args;
		try {
			Integer status = main.run();
			Logging.get().log(Rhino.class, Level.INFO, "Exiting normally with status %d.", status);
			if (status != null) {
				exit(status.intValue());
			} else {
				main.rhino.getEngine().getDebugger().destroy();
				//	JVM will exit normally when non-daemon threads complete.
			}
		} catch (Invocation.CheckedException e) {
			Logging.get().log(Rhino.class, Level.INFO, "Exiting with checked exception.", e);
			System.err.println(e.getMessage());
			exit(1);
		} catch (Throwable t) {
			Logging.get().log(Rhino.class, Level.SEVERE, "Exiting with throwable.", t);
			Throwable target = t;
			System.err.println("Error executing " + Rhino.class.getName());
			String argsString = "";
			for (int i=0; i<args.length; i++) {
				argsString += args[i];
				if (i+1 != args.length) {
					argsString += ",";
				}
			}
			System.err.println("Arguments " + argsString);
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
			exit(1);
		}
	}
}