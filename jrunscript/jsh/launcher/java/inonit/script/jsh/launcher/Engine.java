//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh.launcher;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.logging.*;

import javax.script.*;

import inonit.system.*;

public abstract class Engine {
	private static Logger LOG = Logger.getLogger(Engine.class.getName());

	abstract String id();
	abstract Integer run(URL script, String[] args) throws IOException, ScriptException;

	static class Nashorn extends Engine {
		private ScriptEngineManager factory;

		Nashorn(ScriptEngineManager factory) {
			this.factory = factory;
		}

		@Override String id() {
			return "nashorn";
		}

		Integer run(URL script, String[] args) throws IOException, ScriptException {
			ScriptEngine engine = factory.getEngineByName("nashorn");
			LOG.log(Level.FINE, "arguments.length = %d", args.length);
			this.factory.getBindings().put("javax.script.argv", args);
			LOG.log(Level.FINE, "script: " + script);
			ScriptContext c = engine.getContext();
			c.setAttribute(ScriptEngine.FILENAME, script, ScriptContext.ENGINE_SCOPE);
			java.net.URLConnection connection = script.openConnection();
			engine.eval(new InputStreamReader(connection.getInputStream()), c);
			LOG.log(Level.FINE, "completed script: " + script);
			return null;
		}
	}

	public static class Rhino extends Engine {
		private ClassLoader loader;
		private boolean debug;

		public Rhino(ClassLoader loader, boolean debug) {
			this.loader = loader;
			this.debug = debug;
		}

		public static final int NULL_EXIT_STATUS = -42;

		@Override String id() {
			return "rhino";
		}

		private boolean debug() {
			return debug;
		}

		private java.lang.reflect.Method getMainMethod() throws IOException, ClassNotFoundException, NoSuchMethodException {
			String mainClassName = (debug()) ? "org.mozilla.javascript.tools.debugger.Main" : "org.mozilla.javascript.tools.shell.Main";
			Class<?> shell = loader.loadClass(mainClassName);
			String mainMethodName = (debug()) ? "main" : "exec";
			java.lang.reflect.Method main = shell.getMethod(mainMethodName, new Class[] { String[].class });
			return main;
		}

		private String[] getArguments(URL script, String[] args) {
			ArrayList<String> strings = new ArrayList<String>();
			strings.add("-opt");
			strings.add("-1");
			strings.add(script.toExternalForm());
			strings.addAll(Arrays.asList(args));
			return strings.toArray(new String[0]);
		}

		private Integer getExitStatus() throws IOException, ClassNotFoundException, NoSuchFieldException, IllegalAccessException {
			Class c = loader.loadClass("org.mozilla.javascript.tools.shell.Main");
			java.lang.reflect.Field field = c.getDeclaredField("exitCode");
			field.setAccessible(true);
			int rv = field.getInt(null);
			if (rv == NULL_EXIT_STATUS) return null;
			return new Integer(rv);
		}

		@Override Integer run(URL script, String[] args) throws IOException {
			Integer status = null;
			try {
				java.lang.reflect.Method main = this.getMainMethod();
				LOG.log(Level.FINER, "Rhino shell main = %s", main);
				String[] arguments = this.getArguments(script, args);
				LOG.log(Level.FINER, "Rhino shell arguments:");
				for (int i=0; i<arguments.length; i++) {
					LOG.log(Level.FINER, "Rhino shell argument %d: %s", new Object[] { i, arguments[i] });
				}
				LOG.log(Level.INFO, "Entering Rhino shell");
				main.invoke(null, new Object[] { arguments });
				status = this.getExitStatus();
				LOG.log(Level.INFO, "Exited Rhino shell with status: %s", status);
			} catch (ClassNotFoundException e) {
				e.printStackTrace();
				status = new Integer(127);
			} catch (NoSuchMethodException e) {
				e.printStackTrace();
				status = new Integer(127);
			} catch (NoSuchFieldException e) {
				e.printStackTrace();
				status = new Integer(127);
			} catch (IllegalAccessException e) {
				e.printStackTrace();
				status = new Integer(127);
			} catch (java.lang.reflect.InvocationTargetException e) {
				e.printStackTrace();
				status = new Integer(127);
			}
			return status;
		}
	}
}
