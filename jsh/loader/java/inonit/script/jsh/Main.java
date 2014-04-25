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
import inonit.script.runtime.io.*;

public class Main {
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
	}

	private String[] arguments;

	private Configuration rhino;

	private Main() {
	}

	private Integer run() throws Invocation.CheckedException {
		Installation installation = null;
		Invocation invocation = null;
		if (System.getProperty("jsh.launcher.packaged") != null) {
			installation = Installation.packaged();
			invocation = Invocation.packaged(arguments);
		} else {
			installation = Installation.unpackaged();
			invocation = Invocation.create(arguments);
		}

		final Shell.Configuration configuration = Shell.Configuration.main();
		
		this.rhino = new Configuration() {
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
								Logging.get().log(Main.class, Level.INFO, "Swallowing AWT exception assumed to be caused by debugger.", e);
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
						Logging.get().log(Main.class, Level.FINER, "Logging: " + message + " to System.err ...");
						((PrintStream)configuration.getStdio().getStandardError()).println(message);
					}
				};
			}
		};

		Integer rv = Main.execute(
			installation,
			configuration,
			this.rhino,
			invocation,
			arguments
		);

		return rv;
	}

	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	public static Integer execute(Installation installation, Shell.Configuration configuration, Main.Configuration rhino, Invocation invocation, String[] arguments) {
		return Host.create(installation, configuration, rhino, invocation).execute(arguments);
	}

	public static Scriptable load(Installation installation, Shell.Configuration configuration, Main.Configuration rhino, Invocation invocation) {
		return Host.create(installation, configuration, rhino, invocation).load();
	}
	
	static class Host {
		private Installation installation;
		private Shell.Configuration configuration;
		private Main.Configuration rhino;
		private Invocation invocation;

//		private Engine engine;

		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		static Host create(Installation installation, Shell.Configuration configuration, Main.Configuration rhino, Invocation invocation) {
			Host rv = new Host();
			rv.installation = installation;
			rv.configuration = configuration;
			rv.rhino = rhino;
			rv.rhino.initialize(rv.configuration);
			rv.invocation = invocation;
//			rv.engine = configuration.getEngine();
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

		private Engine.Program createProgram(String[] arguments) {
			Engine.Program program = new Engine.Program();

			Engine.Program.Variable engine = Engine.Program.Variable.create(
				"$engine",
				Engine.Program.Variable.Value.create(new EngineInterface(arguments))
			);
			engine.setReadonly(true);
			engine.setPermanent(true);
			engine.setDontenum(true);
			program.set(engine);

			if (true) {
				Engine.Program.Variable jsh = Engine.Program.Variable.create(
					"$host",
					Engine.Program.Variable.Value.create(new Interface())
				);
				jsh.setReadonly(true);
				jsh.setPermanent(true);
				jsh.setDontenum(true);
				program.set(jsh);
			} else {
				Engine.Source hostJs = Engine.Source.create(installation.getJshLoader("host.js"));
				program.add(hostJs);				
			}

			Engine.Source jshJs = Engine.Source.create(installation.getJshLoader("jsh.js"));
			if (jshJs == null) {
				throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
			}
			program.add(jshJs);
			//	TODO	jsh could execute this below
			program.add(Engine.Source.create(invocation.getScript().getSource()));
			return program;
		}

		Integer execute(String[] arguments) {
			try {
				Object ignore = rhino.getEngine().execute(createProgram(arguments));
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

		Scriptable load() {
			if (true) throw new UnsupportedOperationException("Broken.");
			return rhino.getEngine().load(createProgram(null));
		}
		
		public class EngineInterface {
			private String[] arguments;
			
			EngineInterface(String[] arguments) {
				this.arguments = arguments;
			}
			
			public String[] getArguments() {
				return arguments;
			}
			
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
			
			public void script(String name, String code, Scriptable scope, Scriptable target) throws IOException {
				Host.this.rhino.getEngine().script(name, code, scope, target);
			}

			public void exit(int status) throws ExitException {
				Host.this.rhino.getEngine().getDebugger().setBreakOnExceptions(false);
				throw new ExitException(status);
			}

			//	TODO	this is really intended to include a Main.Configuration as well but we are in the middle of refactoring
			public int jsh(Shell.Configuration configuration, final File script, final String[] arguments) {
				Invocation invocation = new Invocation() {
					@Override public Invocation.Script getScript() {
						return Invocation.Script.create(script);
					}

					@Override public String[] getArguments() {
						return arguments;
					}
				};
				Integer rv = Main.execute(installation, configuration, rhino, invocation, arguments);
				if (rv == null) return 0;
				return rv.intValue();
			}
		}

		public class Interface {
			public String toString() {
				return getClass().getName()
					+ " engine=" + rhino.getEngine()
					+ " installation=" + installation
					+ " classpath=" + rhino.getEngine().getApplicationClassLoader()
				;
			}

			public Scriptable getRhinoLoader() throws IOException {
				return inonit.script.rhino.Engine.load(rhino.getEngine(), new inonit.script.engine.Loader() {
					@Override public String getLoaderCode(String path) throws IOException {
						return new Streams().readString(installation.getPlatformLoader(path).getReader());
					}
				});
			}

			public class Loader {
				public Code getBootstrapModule(String path) {
					return installation.getShellModuleCode(path);
				}

				public Installation.Plugin[] getPlugins() {
					return installation.getPlugins();
				}

				public Code.Source getPackagedCode() {
					return configuration.getPackagedCode();
				}

				public void addFinalizer(Runnable runnable) {
					finalizers.add(runnable);
				}

				//	TODO	only known use of this is in addClasses.jsh.js test script; replace that with access to rhino/host
				//			module and remove this?
				public Class getJavaClass(String name) {
					try {
						return rhino.getEngine().getApplicationClassLoader().loadClass(name);
					} catch (ClassNotFoundException e) {
						return null;
					}
				}

				//	TODO	Currently used in httpd unit testing in embedded server, possibly; may be able to get rid of it
				//			given the new architecture running httpd unit tests in jsh subshell
				public ClassLoader getClassLoader() {
					return rhino.getEngine().getApplicationClassLoader();
				}
			}

			public Loader getLoader() {
				return new Loader();
			}

			public Properties getSystemProperties() {
				return configuration.getSystemProperties();
			}

			public OperatingSystem.Environment getEnvironment() {
				return configuration.getEnvironment();
			}

			public class Stdio {
				public InputStream getStandardInput() {
					Logging.get().log(Stdio.class, Level.CONFIG, "stdin = %s", configuration.getStdio().getStandardInput());
					return configuration.getStdio().getStandardInput();
				}

				public PrintStream getStandardOutput() {
					return new PrintStream(configuration.getStdio().getStandardOutput());
				}

				public PrintStream getStandardError() {
					return new PrintStream(configuration.getStdio().getStandardError());
				}
			}

			public Stdio getStdio() {
				return new Stdio();
			}

			//	Contains information used by jsh.script, like arguments and the base file invoked
			public Invocation getInvocation() {
				return invocation;
			}

			public Installation.Plugin[] getPlugins(File file) {
				return Installation.Plugin.get(file);
			}

//			//
//			//	Not used by shell, but useful to specialized scripts that do various kinds of embedding
//			//
//
//			public Engine getEngine() {
//				return Interface.this.engine;
//			}
//
//			public class Engine {
//				public Module load(Code code) {
//					return Host.this.engine.load(code);
//				}
//			}
		}
	}
	private static void exit(int status) {
		System.exit(status);
	}

	public static void main(String[] args) throws Throwable {
		if (!inonit.system.Logging.get().isSpecified()) {
			inonit.system.Logging.get().initialize(new java.util.Properties());
		}
		Logging.get().log(Main.class, Level.INFO, "Starting script: arguments = %s", Arrays.asList(args));
		Main main = new Main();
		main.arguments = args;
		try {
			Integer status = main.run();
			Logging.get().log(Main.class, Level.INFO, "Exiting normally with status %d.", status);
			if (status != null) {
				exit(status.intValue());
			} else {
				main.rhino.getEngine().getDebugger().destroy();
				//	JVM will exit normally when non-daemon threads complete.
			}
		} catch (Invocation.CheckedException e) {
			Logging.get().log(Main.class, Level.INFO, "Exiting with checked exception.", e);
			System.err.println(e.getMessage());
			exit(1);
		} catch (Throwable t) {
			Logging.get().log(Main.class, Level.SEVERE, "Exiting with throwable.", t);
			Throwable target = t;
			System.err.println("Error executing " + Main.class.getName());
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