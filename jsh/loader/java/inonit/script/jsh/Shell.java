//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.net.*;
import java.util.*;

import org.mozilla.javascript.*;

import inonit.script.rhino.*;
import inonit.script.runtime.io.*;

public class Shell {
	//	TODO	try to remove dependencies on inonit.script.rhino.*;

	public static int execute(Installation installation, Configuration configuration, Invocation invocation) {
		return Host.create(installation, configuration, invocation).execute();
	}

	public static Scriptable load(Installation installation, Configuration configuration, Invocation invocation) {
		return Host.create(installation, configuration, invocation).load();
	}

	public static abstract class Script {
		public static Script create(final File f) {
			if (!f.exists()) return null;
			return new Script() {
				public String getName() {
					try {
						return f.getCanonicalPath();
					} catch (java.io.IOException e) {
						throw new RuntimeException(e);
					}
				}

				public Reader getReader() {
					try {
						return new FileReader(f);
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}
			};
		}

		public static Script create(final String name, final Reader reader) {
			return new Script() {
				public String getName() {
					return name;
				}

				public Reader getReader() {
					return reader;
				}
			};
		}

		public static Script create(String name, InputStream in) {
			return create(name, new InputStreamReader(in));
		}

		public abstract String getName();
		public abstract Reader getReader();

		final Engine.Source toSource() {
			return Engine.Source.create(getName(), getReader());
		}
	}

	public static abstract class Installation {
		public abstract Script getPlatformLoader();
		public abstract Script getRhinoLoader();
		public abstract Script getJshLoader();

		/**
		 *	Specifies where code for "shell modules" -- modules included with jsh itself -- can be found.
		 *
		 *	@param path A logical path to the module; e.g., js/object for the jsh.js module.
		 *
		 *	@return An object that can load the specified module.
		 */
		public abstract Code getShellModuleCode(String path);

		/**
		 *
		 *	@return An object capable of loading modules bundled with a script if this is a packaged application, or
		 *	<code>null</code> if it is not.
		 */
		public abstract Code.Source getPackagedCode();
	}

	public static abstract class Configuration {
		public abstract int getOptimizationLevel();
		public abstract Engine.Debugger getDebugger();
		public abstract Engine.Log getLog();
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract Map getEnvironment();
		public abstract Stdio getStdio();

		static abstract class Classpath extends ClassLoader {
			static Classpath create(ClassLoader delegate) {
				return new ModulesClasspath(delegate);
			}

			Classpath(ClassLoader delegate) {
				super(delegate);
			}

			abstract Loader.Classpath toLoaderClasspath();
		}

		private static class ModulesClasspath extends Classpath {
			private ArrayList items = new ArrayList();

			ModulesClasspath(ClassLoader delegate) {
				super(delegate);
			}

			public String toString() {
				String rv = getClass().getName() + " ";
				for (int i=0; i<items.size(); i++) {
					rv += items.get(i);
					if (i+1 != items.size()) {
						rv += ",";
					}
				}
				return rv;
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				String path = name.replace('.', '/') + ".class";
				for (int i=0; i<items.size(); i++) {
					Code.Source classes = ((Code.Source)items.get(i));
					try {
						InputStream stream = classes.getResourceAsStream(path);
						if (stream != null) {
							byte[] b = new Streams().readBytes(stream);
							return defineClass(name, b, 0, b.length);
						}
					} catch (IOException e) {
						//	Treat an exception reading as not found
						//	TODO	dubious decision
					}
				}
				throw new ClassNotFoundException("Class not found in " + this.toString() + ": " + name);
			}

			public Loader.Classpath toLoaderClasspath() {
				return new Loader.Classpath() {
					@Override public void append(Code.Source classes) {
						items.add(classes);
					}
				};
			}
		}

		private Engine engine;
		private Classpath classpath;

		final void initialize() {
			final Configuration configuration = this;
			ContextFactoryImpl contexts = new ContextFactoryImpl();
			this.classpath = Classpath.create(configuration.getClassLoader());
			contexts.initApplicationClassLoader(classpath);
			contexts.setOptimization(configuration.getOptimizationLevel());
			this.engine = Engine.create(configuration.getDebugger(), contexts);
		}

		Engine getEngine() {
			return engine;
		}

		Classpath getClasspath() {
			return classpath;
		}

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Invocation {
		public static abstract class Script {
			private static Script create(final Shell.Script delegate, final File file) {
				return new Script() {
					@Override
					public File getFile() {
						return file;
					}

					@Override
					public String getName() {
						return delegate.getName();
					}

					@Override
					public Reader getReader() {
						return delegate.getReader();
					}
				};
			}

			static Script create(File file) {
				return create(Shell.Script.create(file), file);
			}

			static Script create(final Shell.Script delegate) {
				return create(delegate, null);
			}

			public abstract String getName();
			/**
				Returns the <code>java.io.File</code> object corresponding to the main script.

				@return The <code>java.io.File</code> object corresponding to the main script, or <code>null</code> if there is no
					such file; e.g., the script has been packaged into a JAR file.
			*/
			public abstract File getFile();
			public abstract Reader getReader();
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

			Script jshJs = installation.getJshLoader();
			if (jshJs == null) {
				throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
			}
			program.add(jshJs.toSource());
			program.add(Engine.Source.create(invocation.getScript().getName(), invocation.getScript().getReader()));
			return program;
		}

		int execute() {
			try {
				Object ignore = configuration.getEngine().execute(createProgram());
				return 0;
			} catch (Engine.Errors e) {
				Engine.Errors.ScriptError[] errors = e.getErrors();
				for (int i=0; i<errors.length; i++) {
					Throwable t = errors[i].getThrowable();
					if (t instanceof WrappedException) {
						WrappedException wrapper = (WrappedException)t;
						if (wrapper.getWrappedException() instanceof ExitException) {
							return ((ExitException)wrapper.getWrappedException()).getStatus();
						}
					}
				}
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
					+ " classpath=" + configuration.getClasspath()
				;
			}

			public Scriptable getRhinoLoader() throws IOException {
				Loader loader = new Loader() {
					@Override
					public String getPlatformCode() throws IOException {
						return new Streams().readString(installation.getPlatformLoader().getReader());
					}

					@Override
					public String getRhinoCode() throws IOException {
						return new Streams().readString(installation.getRhinoLoader().getReader());
					}

					@Override
					public Loader.Classpath getClasspath() {
						return configuration.getClasspath().toLoaderClasspath();
					}

					@Override
					protected Engine getEngine() {
						return Host.this.configuration.getEngine();
					}
				};
				return loader.initialize(configuration.getEngine());
			}

			public Code getBootstrapModule(String path) {
				return installation.getShellModuleCode(path);
			}

			public Code.Source getPackagedCode() {
				return installation.getPackagedCode();
			}

			public Properties getSystemProperties() {
				return configuration.getSystemProperties();
			}

			public Map getEnvironment() {
				return configuration.getEnvironment();
			}

			public class Stdio {
				public InputStream getStandardInput() {
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

			public Engine.Debugger getDebugger() {
				return Host.this.configuration.getEngine().getDebugger();
			}

			public Class loadClass(String name) throws ClassNotFoundException {
				return configuration.getClasspath().loadClass(name);
			}

			public Invocation getInvocation() {
				return invocation;
			}

			public void addFinalizer(Runnable runnable) {
				finalizers.add(runnable);
			}

			public void exit(int status) throws ExitException {
				Host.this.configuration.getEngine().getDebugger().setBreakOnExceptions(false);
				throw new ExitException(status);
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