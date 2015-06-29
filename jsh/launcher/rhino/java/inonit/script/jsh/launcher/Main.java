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

package inonit.script.jsh.launcher;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.logging.*;

import javax.script.*;

import inonit.system.*;
import inonit.system.cygwin.*;

public class Main {
	private Main() {
	}

	private static String getSetting(String name) {
		if (System.getProperty(name) != null) return System.getProperty(name);
		String environment = name.replace("\\.", "_").toUpperCase();
		if (System.getenv(environment) != null) return System.getenv(environment);
		return null;
	}

	static class Invocation {
		static abstract class Configuration {
			abstract Shell shell();
			abstract Engine engine();
		}

		private Configuration configuration;

		Invocation(Configuration configuration) {
			this.configuration = configuration;
			Logging.get().log(Main.class, Level.CONFIG, "Invoking: " + configuration.shell() + " with engine named " + configuration.engine().id());
			Logging.get().log(Main.class, Level.FINE, "Using engine: " + configuration.engine());
		}

		private Properties getDefaultJavaLoggingProperties() throws IOException {
			Properties rv = new Properties();
			return rv;
		}

		final Integer run(String[] arguments) throws IOException, ScriptException {
			if (!inonit.system.Logging.get().isSpecified()) {
				inonit.system.Logging.get().initialize(this.getDefaultJavaLoggingProperties());
			}
			Logging.get().log(Main.class, Level.INFO, "Launching script: %s", Arrays.asList(arguments));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			Logging.get().log(Main.class, Level.FINEST, "System.in = %s", System.in);
			InputStream stdin = new Logging.InputStream(System.in);
			System.setIn(stdin);
			Logging.get().log(Main.class, Level.CONFIG, "Set System.in to %s.", stdin);
			System.setOut(new PrintStream(new Logging.OutputStream(System.out, "stdout")));
			System.setErr(new PrintStream(new Logging.OutputStream(System.err, "stderr")));
			Logging.get().log(Main.class, Level.INFO, "Console: %s", String.valueOf(System.console()));
			Logging.get().log(Main.class, Level.FINER, "Initializing system properties; engine = " + configuration.engine() + " ...");
			Logging.get().log(Main.class, Level.FINER, "Engine: %s", configuration.engine());
			//	TODO	get rid of next property, which seems to only be used in the build process
			System.setProperty("jsh.launcher.engine", configuration.engine().id());
			System.getProperties().put("jsh.launcher.shell", configuration.shell());
			System.setProperty("inonit.jrunscript.api.main", configuration.shell().getLauncherScript().toExternalForm());
			return configuration.engine().run(configuration.shell().getJrunscriptApi(), arguments);
		}
	}

	private static class BeforeExit implements Runnable {
		private Integer status = null;

		void setStatus(Integer status) {
			this.status = status;
		}

		public void run() {
			System.out.flush();
			Logging.get().log(Main.class, Level.INFO, "Exit status: %s", String.valueOf(status));
			System.err.flush();
		}
	}

	private void run(Configuration configuration, String[] args) throws IOException {
		BeforeExit beforeExit = new BeforeExit();
		Thread beforeExitThread = new Thread(beforeExit);
		beforeExitThread.setName("BeforeExit");
		Runtime.getRuntime().addShutdownHook(beforeExitThread);
		Invocation invocation = new Invocation(configuration.invocation());
		Integer status = null;
		try {
			status = invocation.run(args);
			Logging.get().log(Main.class, Level.FINER, "Completed with status: %d", status);
		} catch (Throwable t) {
			t.printStackTrace();
			status = new Integer(127);
			Logging.get().log(Main.class, Level.FINER, "Completed with stack trace.");
		} finally {
			beforeExit.setStatus(status);
			//	Ensure the VM exits even if the Rhino debugger is displayed
			if (status != null) {
				System.exit(status.intValue());
			}
		}
	}

	public static void main(String[] args) throws java.io.IOException {
		Main main = new Main();
		Configuration configuration = new Configuration() {
			boolean debug() {
				return getSetting("jsh.launcher.debug") != null;
			}

			String engine() {
				return getSetting("jsh.engine");
			}

			String src() {
				return getSetting("jsh.shell.src");
			}

			String rhino() {
				return getSetting("jsh.engine.rhino.classpath");
			}
		};
		if (args.length == 1 && args[0].equals("-engines")) {
			List<String> engines = configuration.engines();
			System.out.print("[");
			for (int i=0; i<engines.size(); i++) {
				if (i > 0) {
					System.out.print(",");
				}
				System.out.print("\"" + engines.get(i) + "\"");
			}
			System.out.print("]");
		} else {
			Logging.get().log(Main.class, Level.FINEST, "Launcher Main executing ...");
			main.run(
				configuration,
				args
			);
		}
	}
}