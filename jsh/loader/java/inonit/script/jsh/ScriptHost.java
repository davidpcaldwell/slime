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

public class ScriptHost {	
	public static abstract class Script {
		public abstract String getName();
		public abstract Reader getReader();
		
		final Engine.Source toSource() {
			return Engine.Source.create(getName(), getReader());
		}
	}

	static abstract class Installation {
		abstract File getModulePath(String path);
		abstract Script load(String prefix, String name);
		abstract File getPlatformLoader();
		abstract File getRhinoLoader();
	}

	public static abstract class Invocation {
		public abstract File getScript();
		public abstract String[] getArguments();
	}
	
	static abstract class Configuration {
		abstract int getOptimizationLevel();
		abstract Engine.Debugger getDebugger();
		abstract Installation getLoader();
		abstract Invocation getInvocation();
	}

	private static class Classpath extends ClassLoader {
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

		public void append(ClassLoader loader) {
			loaders.add(loader);
		}
	}
	
	static ScriptHost create(Configuration configuration) {
		ContextFactoryImpl contexts = new ContextFactoryImpl();
		Classpath classpath = new Classpath();
		contexts.initApplicationClassLoader(classpath);
		contexts.setOptimization(configuration.getOptimizationLevel());
		Engine engine = Engine.create(configuration.getDebugger(), contexts);
		return new ScriptHost(classpath, engine, configuration.getInvocation(), configuration.getLoader());
	}

	private Classpath classpath;
	private Engine engine;
	private File main;
	private Invocation invocation;
	
	private Installation loader;
	
	private Engine.Program program;
	
	private ScriptHost(Classpath classpath, Engine engine, Invocation invocation, Installation loader) {
		this.classpath = classpath;
		this.engine = engine;
		this.invocation = invocation;
		
		this.loader = loader;
		
		this.program = new Engine.Program();
		
		Engine.Program.Variable jsh = Engine.Program.Variable.create(
			Engine.ObjectName.create("jsh"),
			"$host",
			Engine.Program.Variable.Value.create(this)
		);
		jsh.setReadonly(true);
		jsh.setPermanent(true);
		jsh.setDontenum(true);
		program.set(jsh);
		
		Script jshJs = loader.load("jsh", "jsh.js");
		if (jshJs == null) {
			throw new RuntimeException("Could not locate jsh.js bootstrap file using " + loader);
		}
		this.program.add(Engine.ObjectName.create("jsh"), jshJs.toSource());
		this.program.add(null, Engine.Source.create(invocation.getScript()));
		
	}
	
	static class ExitException extends Exception {
		private int status;
		
		ExitException(int status) {
			this.status = status;
		}
		
		int getStatus() {
			return status;
		}
	}

	public void addClasses(File source) throws MalformedURLException {
		classpath.append(source.toURI().toURL());
	}

	//	Still used by jsh.$module
	public void addClasses(Module module) {
		classpath.append(module.getClasses());
	}

	public ClassLoader getClassLoader() {
		return classpath;
	}

	public void exit(int status) throws ExitException {
		throw new ExitException(status);
	}

	public Invocation getInvocation() {
		return invocation;
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
				if (classpath == null) {
					return Module.Code.Classes.create(createSource(new File[] { file }), "$jvm/classes");
				} else {
					return Module.Code.Classes.create(createSource(classpath), null);
				}
			}
		};
	}

	public Module getBootstrapModule(String path) {
		Module rv = engine.load(createModuleCode(loader.getModulePath(path),"module.js",null));
		classpath.append(rv.getClasses());
		return rv;
	}

	public Module getModule(File file, String main, File[] classes) {
		Module.Code code = createModuleCode(file,main,classes);
		Module rv = engine.load(code);
		classpath.append(rv.getClasses());
		return rv;
	}

	public String getScriptCode(File file) throws IOException {
		if (!file.exists()) return null;
		Streams streams = new Streams();
		return streams.readString(new FileInputStream(file));
	}

	//	This method is used by jsh itself to load its component parts
	public Scriptable load(Scriptable parent, Scriptable scope, String family, String name) throws IOException {
		Script script = loader.load(family, name);
		if (engine == null) throw new RuntimeException("'engine' is null");
		if (script == null) throw new RuntimeException("'script' is null with family " + family + " and name " + name);
		engine.include(scope, script.toSource());
		scope.setParentScope(parent);
		return scope;
	}

	public void script(Scriptable scope, String name, InputStream code) throws IOException {
		engine.script(scope, name, code);
	}
	
	public void execute(Scriptable scope, Script script) throws IOException {
		engine.include(scope, Engine.Source.create(script.getName(), script.getReader()));
	}

	public boolean declared(Scriptable scope, String name) {
		try {
			Scriptable value = engine.evaluate(scope,"eval(\"" + name + "\")");
			return true;
		} catch (ClassCastException e) {
			throw new RuntimeException(e);
		} catch (org.mozilla.javascript.EcmaError e) {
			if (e.getName().equals("ReferenceError")) {
				return false;
			} else {
				throw new RuntimeException(e);
			}
		}
	}

	public Engine.Loader getRhinoLoaderBootstrap() {
		return new Engine.Loader() {
			public String getPlatformCode() throws IOException {
				File file = loader.getPlatformLoader();
				InputStream in = new FileInputStream(file);
				return new Streams().readString(in);
			}

			public String getRhinoCode() throws IOException {
				File file = loader.getRhinoLoader();
				InputStream in = new FileInputStream(file);
				return new Streams().readString(in);
			}
		};
	}
	
	void execute() {
		Object ignore = engine.execute(program);
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
	
	static class ShellEnvironmentImpl extends ScriptHost.ShellEnvironment {
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
