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

	public static abstract class Installation {
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

			public abstract String getName();
			public abstract Reader getReader();

			final Engine.Source toSource() {
				return Engine.Source.create(getName(), getReader());
			}
		}

		public abstract Module.Code getModuleCode(String path);
		public abstract Script getPlatformLoader();
		public abstract Script getRhinoLoader();
		public abstract Script getJshLoader();

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
	}

	public static abstract class Invocation {
		public abstract File getScript();
		public abstract String[] getArguments();
	}
	
	static class Host {
		private Installation installation;

		private Invocation invocation;

		private Engine.Log log;
		private Engine engine;
		private Classpath classpath;

		private static abstract class Classpath extends ClassLoader {
			public abstract void append(URL url);
			public abstract void append(Module module);
		}

		private static class DelegationChain extends Classpath {
			private ClassLoader current = Shell.class.getClassLoader();

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

		static Host create(Installation installation, Configuration configuration, Invocation invocation) {
			ContextFactoryImpl contexts = new ContextFactoryImpl();
			Classpath classpath = new DelegationChain();
			contexts.initApplicationClassLoader(classpath);
			contexts.setOptimization(configuration.getOptimizationLevel());

			Host rv = new Host();
			rv.installation = installation;
			rv.invocation = invocation;
			rv.log = configuration.getLog();
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

		int execute() {
			int status = 0;

			try {
				Engine.Program program = new Engine.Program();

				Engine.Program.Variable jsh = Engine.Program.Variable.create(
					"$host",
					Engine.Program.Variable.Value.create(new Interface())
				);
				jsh.setReadonly(true);
				jsh.setPermanent(true);
				jsh.setDontenum(true);
				program.set(jsh);

				Installation.Script jshJs = installation.getJshLoader();
				if (jshJs == null) {
					throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
				}
				program.add(jshJs.toSource());
				program.add(Engine.Source.create(invocation.getScript()));
				Object ignore = engine.execute(program);
			} catch (Engine.Errors e) {
				Engine.Errors.ScriptError[] errors = e.getErrors();
				boolean skip = false;
				for (int i=0; i<errors.length; i++) {
					Throwable t = errors[i].getThrowable();
					if (t instanceof WrappedException) {
						WrappedException wrapper = (WrappedException)t;
						if (wrapper.getWrappedException() instanceof ExitException) {
							status = ((ExitException)wrapper.getWrappedException()).getStatus();
							skip = true;
						}
					}
				}
				if (!skip) {
					e.dump(log, "[jsh] ");
				}
			}
			return status;
		}

		public class Interface {
			public void exit(int status) throws ExitException {
				throw new ExitException(status);
			}

			public void script(Scriptable scope, String name, InputStream code) throws IOException {
				engine.script(scope, name, code);
			}

			public Module getBootstrapModule(String path) {
				Module rv = engine.load(installation.getModuleCode(path));
				classpath.append(rv);
				return rv;
			}

			public Module getUnpackedModule(File base, String main) {
				Module rv = engine.load(Module.Code.unpacked(base,main));
				classpath.append(rv);
				return rv;
			}

			public Module getPackedModule(File slime, String main) {
				Module rv = engine.load(Module.Code.slime(slime,main));
				classpath.append(rv);
				return rv;
			}

			public ClassLoader getClassLoader() {
				return classpath;
			}

			public Engine.Loader getRhinoLoaderBootstrap() {
				return installation.getRhinoLoaderBootstrap();
			}

			public String getScriptCode(File file) throws IOException {
				if (!file.exists()) return null;
				Streams streams = new Streams();
				return streams.readString(new FileInputStream(file));
			}

			public void addClasses(File classes) throws java.net.MalformedURLException {
				classpath.append(classes.toURI().toURL());
			}

			public Invocation getInvocation() {
				return invocation;
			}
		}
	}
}
