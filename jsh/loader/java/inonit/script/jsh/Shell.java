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

public class Shell {
	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	public static Integer execute(Installation installation, Configuration configuration, Invocation invocation) {
		return Host.create(installation, configuration, invocation).execute();
	}

	public static Scriptable load(Installation installation, Configuration configuration, Invocation invocation) {
		return Host.create(installation, configuration, invocation).load();
	}


	public static abstract class Configuration {
		public abstract int getOptimizationLevel();
		public abstract Engine.Debugger getDebugger();

		//	TODO	consider: should this log implementation be supplied, and just log to stderr?
		public abstract Engine.Log getLog();

		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Stdio getStdio();

		/**
		 *
		 *	@return An object capable of loading modules bundled with a script if this is a packaged application, or
		 *	<code>null</code> if it is not.
		 */
		public abstract Code.Source getPackagedCode();

		private Engine engine;

		final void initialize() {
			Engine.Configuration contexts = new Engine.Configuration() {
				@Override public ClassLoader getApplicationClassLoader() {
					return Configuration.this.getClassLoader();
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

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Invocation {
		public static abstract class Script {
			private static Script create(final Engine.Source delegate, final java.net.URI uri) {
				return new Script() {
					@Override
					public java.net.URI getUri() {
						return uri;
					}

					public Engine.Source getSource() {
						return delegate;
					}
				};
			}

			static Script create(File file) {
				return create(Engine.Source.create(file), file.toURI());
			}

			static Script create(final Engine.Source delegate) {
				return create(delegate, null);
			}

			public abstract java.net.URI getUri();


			//			substitute; currently, it appears to only be used in jsh.js, to set the script property
			public final File getFile() {
				java.net.URI uri = getUri();
				if (uri != null && uri.getScheme() != null && uri.getScheme().equals("file")) {
					return new java.io.File(uri);
				} else {
					return null;
				}
			}

			public abstract Engine.Source getSource();
		}

		public abstract Script getScript();

		public abstract String[] getArguments();
	}

	static class Host {
		private Installation installation;
		private Configuration configuration;
		private Invocation invocation;

//		private Engine engine;

		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		static Host create(Installation installation, Configuration configuration, Invocation invocation) {
			Host rv = new Host();
			rv.installation = installation;
			rv.configuration = configuration;
			rv.invocation = invocation;
			configuration.initialize();
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

		private Engine.Program createProgram() {
			Engine.Program program = new Engine.Program();

			Engine.Program.Variable jsh = Engine.Program.Variable.create(
				"$host",
				Engine.Program.Variable.Value.create(new Interface())
			);
			jsh.setReadonly(true);
			jsh.setPermanent(true);
			jsh.setDontenum(true);
			program.set(jsh);

			Engine.Source jshJs = Engine.Source.create(installation.getJshLoader());
			if (jshJs == null) {
				throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
			}
			program.add(jshJs);
			//	TODO	jsh could execute this below
			program.add(invocation.getScript().getSource());
			return program;
		}

		Integer execute() {
			try {
				Object ignore = configuration.getEngine().execute(createProgram());
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
				Logging.get().log(Shell.class, Level.FINE, "Logging errors to %s.", configuration.getLog());
				e.dump(configuration.getLog(), "[jsh] ");
				return -1;
			} finally {
				for (int i=0; i<finalizers.size(); i++) {
					try {
						finalizers.get(i).run();
					} catch (Throwable t) {
						//	TODO	log something about the exception
						configuration.getLog().println("Error running finalizer: " + finalizers.get(i));
					}
				}
			}
		}

		Scriptable load() {
			return configuration.getEngine().load(createProgram());
		}

		public class Interface {
			public String toString() {
				return getClass().getName()
					+ " engine=" + configuration.getEngine()
					+ " installation=" + installation
					+ " classpath=" + configuration.getEngine().getApplicationClassLoader()
				;
			}

			public Scriptable getRhinoLoader() throws IOException {
				return inonit.script.rhino.Engine.load(configuration.getEngine(), new inonit.script.engine.Loader() {
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
						return configuration.getEngine().getApplicationClassLoader().loadClass(name);
					} catch (ClassNotFoundException e) {
						return null;
					}
				}

				//	TODO	Currently used in httpd unit testing in embedded server, possibly; may be able to get rid of it
				//			given the new architecture running httpd unit tests in jsh subshell
				public ClassLoader getClassLoader() {
					return configuration.getEngine().getApplicationClassLoader();
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

			public class Debugger {
				private Engine.Debugger implementation = Host.this.configuration.getEngine().getDebugger();

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

			//	Contains information used by jsh.script, like arguments and the base file invoked
			public Invocation getInvocation() {
				return invocation;
			}

			public void exit(int status) throws ExitException {
				Host.this.configuration.getEngine().getDebugger().setBreakOnExceptions(false);
				throw new ExitException(status);
			}

			public Installation.Plugin[] getPlugins(File file) {
				List<Installation.Plugin> rv = new ArrayList<Installation.Plugin>();
				Installation.Plugin.addPluginsTo(rv, file);
				return rv.toArray(new Installation.Plugin[rv.size()]);
			}

			public int jsh(Configuration configuration, final File script, final String[] arguments) {
				Invocation invocation = new Invocation() {
					@Override public Invocation.Script getScript() {
						return Invocation.Script.create(script);
					}

					@Override public String[] getArguments() {
						return arguments;
					}
				};
				Integer rv = Shell.execute(installation, configuration, invocation);
				if (rv == null) return 0;
				return rv.intValue();
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
}