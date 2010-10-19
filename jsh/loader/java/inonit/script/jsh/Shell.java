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
	static abstract class Installation {
		static abstract class Script {
			public abstract String getName();
			public abstract Reader getReader();

			final Engine.Source toSource() {
				return Engine.Source.create(getName(), getReader());
			}
		}

		abstract File getModulePath(String path);
		abstract Script load(String prefix, String name);
		abstract File getPlatformLoader();
		abstract File getRhinoLoader();

		Engine.Loader getRhinoLoaderBootstrap() {
			return new Engine.Loader() {
				public String getPlatformCode() throws IOException {
					File file = Installation.this.getPlatformLoader();
					InputStream in = new FileInputStream(file);
					return new Streams().readString(in);
				}

				public String getRhinoCode() throws IOException {
					File file = Installation.this.getRhinoLoader();
					InputStream in = new FileInputStream(file);
					return new Streams().readString(in);
				}
			};
		}
	}

	public static abstract class Invocation {
		public abstract File getScript();
		public abstract String[] getArguments();
	}
	
	public static class Host {
		private Installation installation;

		private Invocation invocation;

		private Engine.Log log;
		private Engine engine;
		private Classpath classpath;

		static abstract class Configuration {
			abstract int getOptimizationLevel();
			abstract Engine.Debugger getDebugger();
			abstract Engine.Log getLog();
		}

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
					Engine.ObjectName.create("jsh"),
					"$host",
					Engine.Program.Variable.Value.create(new Interface())
				);
				jsh.setReadonly(true);
				jsh.setPermanent(true);
				jsh.setDontenum(true);
				program.set(jsh);

				Installation.Script jshJs = installation.load("jsh", "jsh.js");
				if (jshJs == null) {
					throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
				}
				program.add(Engine.ObjectName.create("jsh"), jshJs.toSource());
				program.add(null, Engine.Source.create(invocation.getScript()));
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

			private Module.Code.Source createSource(File[] files) {
				try {
					java.net.URL[] urls = new java.net.URL[files.length];
					for (int i=0; i<urls.length; i++) {
						urls[i] = files[i].toURI().toURL();
					}
					ClassLoader loader = new java.net.URLClassLoader(urls, null);
					return Module.Code.Source.create(loader);
				} catch (java.io.IOException e) {
					throw new RuntimeException("Unreachable", e);
				}
			}

			private Module.Code createModuleCode(final File file, final String main, final File[] classpath) {
				return new Module.Code() {
					public String toString() {
						try {
							String rv = getClass().getName() + ": base=" + file.getCanonicalPath() + " main=" + main;
							if (classpath != null) {
								rv += " classpath=";
								for (int i=0; i<classpath.length; i++) {
									rv += classpath[i].getCanonicalPath();
								}
							}
							return rv;
						} catch (IOException e) {
							return getClass().getName() + ": " + file.getAbsolutePath() + " [error getting canonical]";
						}
					}

					public Module.Code.Scripts getScripts() {
						return Module.Code.Scripts.create(
							createSource(new File[] { file }),
							main
						);
					}

					public Module.Code.Classes getClasses() {
						return Module.Code.Classes.create(createSource(new File[] { file }), "$jvm/classes");
					}
				};
			}

			public Module getBootstrapModule(String path) {
				Module rv = engine.load(createModuleCode(installation.getModulePath(path),"module.js",null));
				classpath.append(rv);
				return rv;
			}

			public Module getModule(File base, String main) {
				Module.Code code = createModuleCode(base,main,null);
				Module rv = engine.load(code);
				classpath.append(rv);
				return rv;
			}

			//	TODO	probably want to move classpath back into Interface and allow new Engine to be created each time so that new
			//			classpath is created for scripts each time; this is most realistic embedding
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

	public static abstract class ShellEnvironment {
		private Integer status;
		
		void setStatus(int status) {
			this.status = new Integer(status);
		}
		
		public final Integer getExitStatus() {
			return status;
		}
		
		public abstract OutputStream getStandardOutput();
		public abstract OutputStream getStandardError();
		public abstract InputStream getStandardInput();
		public abstract Map getSubprocessEnvironment();
		public abstract File getWorkingDirectory();
	}
	
	static class ShellEnvironmentImpl extends ShellEnvironment {
		private ByteArrayOutputStream out = new ByteArrayOutputStream();
		private ByteArrayOutputStream err = new ByteArrayOutputStream();
		
		private InputStream in = new ByteArrayInputStream(new byte[0]);
		
		private File working = null;
		private Map environment = null;
		
		private String commandOutput;
		
		public File getWorkingDirectory() {
			return working;
		}
		
		public Map getSubprocessEnvironment() {
			return environment;
		}

		public OutputStream getStandardOutput() {
			return out;
		}

		public OutputStream getStandardError() {
			return err;
		}
		
		public InputStream getStandardInput() {
			return in;
		}
		
		public void setWorkingDirectory(File file) {
			this.working = file;
		}

		public void setStandardInput(InputStream in) {
			this.in = in;
		}
		
		public String getCommandOutput() throws IOException {
			if (commandOutput == null) {
				Reader outputReader = new InputStreamReader(new ByteArrayInputStream(out.toByteArray()));
				StringBuffer outputBuffer = new StringBuffer();
				int charInt;
				while( (charInt = outputReader.read()) != -1) {
					outputBuffer.append( (char)charInt );
				}
				commandOutput = outputBuffer.toString();
			}
			return commandOutput;			
		}
	}
}
