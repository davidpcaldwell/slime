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

import inonit.system.*;
import inonit.script.engine.*;
import inonit.script.rhino.*;

public class Rhino {
	//	TODO	try to remove dependencies on inonit.script.rhino.*;
	
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
		return Host.create(shell, rhino).execute();
	}

//	public static Scriptable load(Installation installation, Shell.Configuration configuration, Rhino.Configuration rhino, Invocation invocation) {
//		return Host.create(installation, configuration, rhino, invocation).load();
//	}
	
	static class Host {
		private Shell shell;
		private Rhino.Configuration rhino;

		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		static Host create(Shell shell, Rhino.Configuration rhino) {
			Host rv = new Host();
			rv.shell = shell;
			rv.rhino = rhino;
			rv.rhino.initialize(rv.shell.getConfiguration());
			return rv;
		}

		private static class ExitException extends Exception {
			private int status;

			ExitException(int status) {
				this.status = status;
			}

			int getStatus() {
				return status;
			}
		}

		private Engine.Program createProgram() throws Invocation.CheckedException {
			Engine.Program program = new Engine.Program();

			Engine.Program.Variable shell = Engine.Program.Variable.create(
				"$shell",
				Engine.Program.Variable.Value.create(this.shell)
			);
			shell.setReadonly(true);
			shell.setPermanent(true);
			shell.setDontenum(true);
			program.set(shell);
			
			Engine.Program.Variable engine = Engine.Program.Variable.create(
				"$engine",
				Engine.Program.Variable.Value.create(new Interface())
			);
			engine.setReadonly(true);
			engine.setPermanent(true);
			engine.setDontenum(true);
			program.set(engine);

			Engine.Source hostJs = Engine.Source.create(this.shell.getInstallation().getJshLoader("host.js"));
			program.add(hostJs);				

			Engine.Source jshJs = Engine.Source.create(this.shell.getInstallation().getJshLoader("jsh.js"));
			if (jshJs == null) {
				throw new RuntimeException("Could not locate jsh.js bootstrap file using " + this.shell.getInstallation());
			}
			program.add(jshJs);
			//	TODO	jsh could execute this below
			program.add(Engine.Source.create(this.shell.getInvocation().getScript().getSource()));
			return program;
		}

		Integer execute() throws Invocation.CheckedException {
			try {
				Object ignore = rhino.getEngine().execute(createProgram());
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

		Scriptable load() throws Invocation.CheckedException {
			return rhino.getEngine().load(createProgram());
		}
		
		public class Interface {
			public class Debugger {
				private Engine.Debugger implementation = Host.this.rhino.getEngine().getDebugger();

				public boolean isBreakOnExceptions() {
					return implementation.isBreakOnExceptions();
				}

				public void setBreakOnExceptions(boolean b) {
					implementation.setBreakOnExceptions(b);
				}
			}

			public Debugger getDebugger() {
				return new Debugger();
			}
			
			public Loader.Classpath getClasspath() {
				return Host.this.rhino.getEngine().getApplicationClassLoader().toScriptClasspath();
			}
			
			public Scriptable script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
				return Host.this.rhino.getEngine().script(name, code, scope, target);
			}

			public void exit(int status) throws ExitException {
				Host.this.rhino.getEngine().getDebugger().setBreakOnExceptions(false);
				throw new ExitException(status);
			}

			//	TODO	this is really intended to include a Main.Configuration as well but we are in the middle of refactoring
			public int jsh(final Shell.Configuration configuration, final File script, final String[] arguments) throws IOException, Invocation.CheckedException {
				final Invocation invocation = new Invocation() {
					@Override public Invocation.Script getScript() {
						return Invocation.Script.create(script);
					}

					@Override public String[] getArguments() {
						return arguments;
					}
				};
				//	TODO	this temporary workaround is for refactoring purposes
				ArrayList<String> restoreArguments = new ArrayList<String>();
				restoreArguments.add(script.getCanonicalPath());
				restoreArguments.addAll(Arrays.asList(arguments));
				Shell subshell = new Shell() {
					@Override public Installation getInstallation() {
						return shell.getInstallation();
					}

					@Override public Shell.Configuration getConfiguration() {
						return configuration;
					}

					@Override public Invocation getInvocation() throws Invocation.CheckedException {
						return invocation;
					}
				};
				Integer rv = Rhino.execute(subshell, Host.this.rhino);
				if (rv == null) return 0;
				return rv.intValue();
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