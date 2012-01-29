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
		public abstract Module.Code getShellModuleCode(String path);

		/**
		 *
		 *	@return An object capable of loading modules bundled with a script if this is a packaged application, or
		 *	<code>null</code> if it is not.
		 */
		public abstract Module.Code.Source getPackagedCode();

		Engine.Loader getRhinoLoaderBootstrap() {
			return new Engine.Loader() {
				public String getPlatformCode() throws IOException {
					return new Streams().readString(Installation.this.getPlatformLoader().getReader());
				}

				public String getRhinoCode() throws IOException {
					return new Streams().readString(Installation.this.getRhinoLoader().getReader());
				}
			};
		}
	}

	public static abstract class Configuration {
		public abstract int getOptimizationLevel();
		public abstract Engine.Debugger getDebugger();
		public abstract Engine.Log getLog();
		public abstract ClassLoader getClassLoader();

		public abstract Properties getSystemProperties();
		public abstract Map getEnvironment();
		public abstract Stdio getStdio();

		public static abstract class Stdio {
			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Invocation {
		/**
		 * Returns the <code>java.io.File</code> object corresponding to the main script.
		 *
		 * @return The <code>java.io.File</code> object corresponding to the main script, or <code>null</code> if there is no such
		 *		file; e.g., the script has been packaged into a JAR file.
		 */
		public abstract File getScriptFile();

		public abstract Script getScript();
		public abstract String[] getArguments();
	}

	static class Host {
		private Installation installation;
		private Configuration configuration;
		private Invocation invocation;

		private Engine engine;
		private Classpath classpath;

		private ArrayList<Runnable> finalizers = new ArrayList<Runnable>();

		private static abstract class Classpath extends ClassLoader {
			static Classpath create(ClassLoader delegate) {
				return new ModulesClasspath(delegate);
			}
	
			Classpath(ClassLoader delegate) {
				super(delegate);
			}
	
			public abstract void append(URL url);
			public abstract void append(Module module);
		}

		private static class DelegationChain extends Classpath {
			private ClassLoader current = Shell.class.getClassLoader();
	
			DelegationChain(ClassLoader delegate) {
				super(delegate);
			}
	
			public String toString() {
				return getClass().getName() + " current=" + current;
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				return current.loadClass(name);
			}

			public void append(URL url) {
				current = new URLClassLoader(new URL[] { url }, current);
			}

			public void append(Module module) {
				current = module.getClasses(current);
			}
		}

		private static class ListClasspath extends Classpath {
			private ArrayList loaders = new ArrayList();
	
			ListClasspath(ClassLoader delegate) {
				super(delegate);
			}

			protected Class findClass(String name) throws ClassNotFoundException {
				for (int i=0; i<loaders.size(); i++) {
					try {
						return ((ClassLoader)loaders.get(i)).loadClass(name);
					} catch (ClassNotFoundException e) {
					}
				}
				throw new ClassNotFoundException();
			}

			public void append(URL url) {
				loaders.add(new URLClassLoader(new URL[] { url }));
			}

			public void append(Module module) {
				loaders.add(module.getClasses(Shell.class.getClassLoader()));
			}
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
					Module.Code.Classes classes = ((Module.Code.Classes)items.get(i));
					try {
						InputStream stream = classes.getResourceAsStream(path);
						if (stream != null) {
							byte[] b = new Streams().readBytes(stream);
							return defineClass(name, b, 0, b.length);
						}
					} catch (IOException e) {
					}
				}
				throw new ClassNotFoundException("Class not found in " + this.toString() + ": " + name);
			}
	
			public void append(Module module) {
				items.add(module.getClasses());
			}
	
			public void append(URL url) {
				items.add(Module.Code.Classes.create(Module.Code.Source.create(url)));
			}
		}

		static Host create(Installation installation, Configuration configuration, Invocation invocation) {
			ContextFactoryImpl contexts = new ContextFactoryImpl();
			Classpath classpath = Classpath.create(configuration.getClassLoader());
			contexts.initApplicationClassLoader(classpath);
			contexts.setOptimization(configuration.getOptimizationLevel());

			Host rv = new Host();
			rv.installation = installation;
			rv.configuration = configuration;
			rv.invocation = invocation;
			rv.engine = Engine.create(configuration.getDebugger(), contexts);
			rv.classpath = classpath;
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
				Object ignore = engine.execute(createProgram());
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
						configuration.getLog().println("Error running finalizer: " + finalizers.get(i));
					}
				}
			}
		}

		Scriptable load() {
			return engine.load(createProgram());
		}

		public class Interface {
			private Engine engine = new Engine();

			public String toString() {
				return getClass().getName()
					+ " engine=" + engine
					+ " installation=" + installation
					+ " classpath=" + classpath
				;
			}

			public void exit(int status) throws ExitException {
				Host.this.engine.getDebugger().setBreakOnExceptions(false);
				throw new ExitException(status);
			}

			public void script(String name, InputStream code, Scriptable scope, Scriptable target) throws IOException {
				Host.this.engine.script(name, code, scope, target);
			}

			public Module getBootstrapModule(String path) {
				Module rv = Host.this.engine.load(installation.getShellModuleCode(path));
				classpath.append(rv);
				return rv;
			}

			public Module getUnpackedModule(File base, String main) {
				Module rv = Host.this.engine.load(Module.Code.unpacked(base,main));
				classpath.append(rv);
				return rv;
			}

			public Module getPackedModule(File slime, String main) {
				Module rv = Host.this.engine.load(Module.Code.slime(slime,main));
				classpath.append(rv);
				return rv;
			}
	
			public Module.Code.Source getPackagedCode() {
				return installation.getPackagedCode();
			}

			public ClassLoader getClassLoader() {
				return classpath;
			}

			public inonit.script.rhino.Engine.Loader getRhinoLoaderBootstrap() {
				return installation.getRhinoLoaderBootstrap();
			}

			public void addClasses(File classes) throws java.net.MalformedURLException {
				classpath.append(classes.toURI().toURL());
			}

			public Invocation getInvocation() {
				return invocation;
			}

			public Properties getSystemProperties() {
				return configuration.getSystemProperties();
			}

			public Map getEnvironment() {
				return configuration.getEnvironment();
			}

			public InputStream getStandardInput() {
				return configuration.getStdio().getStandardInput();
			}

			public PrintStream getStandardOutput() {
				return new PrintStream(configuration.getStdio().getStandardOutput());
			}

			public PrintStream getStandardError() {
				return new PrintStream(configuration.getStdio().getStandardError());
			}

			public void addFinalizer(Runnable runnable) {
				finalizers.add(runnable);
			}
	
			public inonit.script.rhino.Engine.Debugger getDebugger() {
				return Host.this.engine.getDebugger();
			}
	
			//
			//	Not used by shell, but useful to specialized scripts that do various kinds of embedding
			//

			public Engine getEngine() {
				return Interface.this.engine;
			}

			public class Engine {
				public Module load(Module.Code code) {
					return Host.this.engine.load(code);
				}
			}
		}
	}
}