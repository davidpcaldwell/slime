//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;
import java.util.*;

public class Command {
	static Command create(Configuration configuration) {
		Command rv = new Command();
		rv.configuration = configuration;
		return rv;
	}

	public static abstract class Configuration {
		public abstract String getCommand();
		public abstract String[] getArguments();

		final String[] cmdarray() {
			ArrayList args = new ArrayList();
			String program = getCommand();
			String[] arguments = getArguments();
			args.add(program);
			for (int i=0; i<arguments.length; i++) {
				args.add(arguments[i]);
			}
			return (String[])args.toArray(new String[0]);
		}
	}

	public static abstract class Context {
		public abstract OutputStream getStandardOutput();
		public abstract OutputStream getStandardError();
		public abstract InputStream getStandardInput();
		public abstract Map getSubprocessEnvironment();
		public abstract File getWorkingDirectory();

		final String[] envp() {
			String[] env = null;
			Map envMap = getSubprocessEnvironment();
			if (envMap != null) {
				ArrayList list = new ArrayList();
				Iterator i = envMap.keySet().iterator();
				while(i.hasNext()) {
					Object next = i.next();
					if (!(next instanceof String)) {
						throw new RuntimeException("Environment variable name is not a string, but " + next);
					}
					String name = (String)next;
					Object value = envMap.get(name);
					if (!(value instanceof String)) {
						throw new RuntimeException("Environment variable value for " + name + " is not a string, but " + value);
					}
					list.add(name + "=" + value);
				}
				env = (String[])list.toArray(new String[0]);
			}
			return env;
		}
	}

	public static abstract class Listener {
		private Integer status;

		final void finished(int status) {
			this.status = new Integer(status);
			this.finished();
		}

		public final Integer getExitStatus() {
			return status;
		}

		public abstract void finished();
		public abstract void threw(IOException e);
	}

	public static class Result {
		private Integer status;
		private IOException exception;
		private byte[] output;
		private byte[] error;

		final void finished(int status, byte[] output, byte[] error) {
			this.status = new Integer(status);
			this.output = output;
			this.error = error;
		}

		final void threw(IOException e) {
			this.exception = e;
		}

		public final Integer getExitStatus() {
			return status;
		}

		public final InputStream getOutputStream() {
			if (output == null) return null;
			return new ByteArrayInputStream(output);
		}

		public final InputStream getErrorStream() {
			if (error == null) return null;
			return new ByteArrayInputStream(error);
		}

		public final IOException getLaunchException() {
			return exception;
		}

		public final boolean isSuccess() {
			return this.status != null && this.status.intValue() == 0;
		}

		public static class Failure extends Exception {
			private Result result;

			Failure(Result result) {
				this.result = result;
			}

			public Result getResult() {
				return this.result;
			}
		}

		public final Result evaluate() throws Failure {
			if (this.isSuccess()) {
				return this;
			} else {
				throw new Failure(this);
			}
		}
	}

	static String getCommandOutput(String path, String[] arguments) throws IOException {
		Command shell = new Command();
		shell.configuration = new ConfigurationImpl(path,arguments);
		ContextImpl context = new ContextImpl();
		ListenerImpl listener = new ListenerImpl();
		shell.execute(context, listener);
		if (listener.threw() != null) throw listener.threw();
		return context.getCommandOutput();
	}

	static Result execute(String path, String[] arguments) {
		Command shell = new Command();
		ContextImpl context = new ContextImpl();
		shell.configuration = new ConfigurationImpl(path, arguments);
		Result result = new Result();
		shell.execute(context, result);
		return result;
	}

	static int getExitStatus(Context context, Configuration configuration) throws IOException {
		Command shell = new Command();
		shell.configuration = configuration;
		ListenerImpl listener = new ListenerImpl();
		shell.execute(context, listener);
		if (listener.threw() != null) throw listener.threw();
		return listener.getExitStatus();
	}

	private static class ContextImpl extends Context {
		private ByteArrayOutputStream out = new ByteArrayOutputStream();
		private ByteArrayOutputStream err = new ByteArrayOutputStream();

		private InputStream in = new ByteArrayInputStream(new byte[0]);

		private File working = null;
		private Map environment = null;

		public File getWorkingDirectory() {
			return working;
		}

		public Map getSubprocessEnvironment() {
			return environment;
		}

		public ByteArrayOutputStream getStandardOutput() {
			return out;
		}

		public ByteArrayOutputStream getStandardError() {
			return err;
		}

		public InputStream getStandardInput() {
			return in;
		}

		void setWorkingDirectory(File file) {
			this.working = file;
		}

		void setStandardInput(InputStream in) {
			this.in = in;
		}

		private String commandOutput;

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

	private static class ListenerImpl extends Listener {
		private IOException io;

		public void finished() {
		}

		public void threw(IOException e) {
			this.io = e;
		}

		IOException threw() {
			return this.io;
		}
	}

	private static class ConfigurationImpl extends Configuration {
		private String command;
		private String[] arguments;

		ConfigurationImpl(String command, String[] arguments) {
			this.command = command;
			this.arguments = arguments;
		}

		public final String getCommand() {
			return command;
		}

		public final String[] getArguments() {
			return arguments;
		}
	}

	private Configuration configuration;

	Command() {
	}

	static class Process {
		private java.lang.Process delegate;

		private Thread in;
		private Thread err;
		private Thread out;

		private InputStream stdin;

		Process(java.lang.Process delegate, Context context, Configuration configuration) {
			this.delegate = delegate;
			String spoolName = configuration.getCommand();
			this.in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, "stdout: " + spoolName);
			this.err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, "stderr: " + spoolName);
			this.stdin = context.getStandardInput();
			this.out = Spooler.start(this.stdin, delegate.getOutputStream(), true, "stdin from " + this.stdin + ": " + spoolName);
		}

		int waitFor() throws InterruptedException {
			int rv = delegate.waitFor();
			this.in.join();
			this.err.join();
			return rv;
		}

		void destroy() {
			try {
				this.stdin.close();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			delegate.destroy();
		}
	}

	private Process launch(Context context) throws IOException {
		return new Process(
			Runtime.getRuntime().exec( configuration.cmdarray(), context.envp(), context.getWorkingDirectory() )
			,context
			,configuration
		);
	}

	Subprocess start(Context context) throws IOException {
		return new Subprocess(launch(context));
	}

	void execute(ContextImpl context, Result result) {
		try {
			Process p = launch(context);
			try {
				int status = p.waitFor();
				result.finished(status, context.getStandardOutput().toByteArray(), context.getStandardError().toByteArray());
			} catch (InterruptedException e) {
				throw new RuntimeException("Subprocess thread interrupted.");
			}
		} catch (IOException e) {
			result.threw(e);
		} catch (Throwable t) {
			throw new RuntimeException(t);
		}
	}

	void execute(Context context, Listener listener) {
		try {
			Process p = launch(context);
			try {
				listener.finished(p.waitFor());
			} catch (InterruptedException e) {
				throw new RuntimeException("Subprocess thread interrupted.");
			}
		} catch (IOException e) {
			listener.threw(e);
		} catch (Throwable t) {
			throw new RuntimeException(t);
		}
	}

	private static class Spooler implements Runnable {
		static Thread start(InputStream in, OutputStream out, boolean closeOnEnd, String name) {
			Spooler s = new Spooler(in, out, closeOnEnd);
			Thread t = new Thread(s);
			t.setName(t.getName() + ":" + name);
			t.start();
			return t;
		}

		private InputStream in;
		private OutputStream out;

		private boolean closeOnEnd;
		private boolean flush;

		private IOException e;

		Spooler(InputStream in, OutputStream out, boolean closeOnEnd) {
			this.in = in;
			this.out = out;
			this.closeOnEnd = closeOnEnd;
			this.flush = closeOnEnd;
		}

		IOException failure() {
			return e;
		}

		public void run() {
			int i;
			try {
				while( (i = in.read()) != -1 ) {
					out.write(i);
					//	TODO	This flush, which essentially turns off buffering, is necessary for at least some classes of
					//			applications that are waiting on input in order to decide how to proceed.
					if (flush) {
						out.flush();
					}
				}
				if (closeOnEnd) {
					out.close();
				}
			} catch (IOException e) {
				this.e = e;
			}
		}
	}
}