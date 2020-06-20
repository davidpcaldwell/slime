//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;
import java.util.*;
import java.util.logging.*;

public class Command {
	private static final Logger LOG = Logger.getLogger(Command.class.getName());

	public static abstract class Context {
		public abstract OutputStream getStandardOutput();
		public abstract OutputStream getStandardError();
		public abstract InputStream getStandardInput();
		public abstract Map<String,String> getSubprocessEnvironment();
		public abstract File getWorkingDirectory();

		final String[] envp() {
			String[] env = null;
			Map<String,String> envMap = getSubprocessEnvironment();
			if (envMap != null) {
				ArrayList<String> list = new ArrayList<String>();
				Iterator<String> i = envMap.keySet().iterator();
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

	public static abstract class Configuration {
		static Configuration create(final String path, final String[] arguments) {
			return new Configuration() {
				public final String getCommand() {
					return path;
				}

				public final String[] getArguments() {
					return arguments;
				}
			};
		}

		public abstract String getCommand();
		public abstract String[] getArguments();

		final String[] cmdarray() {
			ArrayList<String> args = new ArrayList<String>();
			String program = getCommand();
			String[] arguments = getArguments();
			args.add(program);
			for (int i=0; i<arguments.length; i++) {
				args.add(arguments[i]);
			}
			return (String[])args.toArray(new String[0]);
		}
	}

	public static class Listener {
		private Integer status;
		private IOException threw;

		final void finished(int status) {
			this.status = Integer.valueOf(status);
		}

		final void threw(IOException e) {
			this.threw = e;
		}

		public final Integer getExitStatus() {
			return status;
		}

		public final IOException getLaunchException() {
			return threw;
		}
	}

	public static class Result {
		private static class ContextImpl extends Context {
			private ByteArrayOutputStream out = new ByteArrayOutputStream();
			private ByteArrayOutputStream err = new ByteArrayOutputStream();

			private InputStream in = new ByteArrayInputStream(new byte[0]);

			private File working = null;
			private Map<String,String> environment = null;

			public File getWorkingDirectory() {
				return working;
			}

			public Map<String,String> getSubprocessEnvironment() {
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

		private IOException exception;
		private byte[] output;
		private byte[] error;
		private ContextImpl context = new ContextImpl();
		private Listener listener = new Listener();

		Context getContext() {
			return context;
		}

		Listener getListener() {
			return listener;
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
			return listener.getExitStatus() != null && listener.getExitStatus().intValue() == 0;
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

		public String getCommandOutput() throws IOException {
			return context.getCommandOutput();
		}

		public final Result evaluate() throws Failure {
			if (this.isSuccess()) {
				return this;
			} else {
				throw new Failure(this);
			}
		}
	}

	static class Process {
		private java.lang.Process delegate;

		private Thread in;
		private Thread err;

		private InputStream stdin;

		Process(java.lang.Process delegate, Context context, Configuration configuration) {
			this.delegate = delegate;
			String spoolName = configuration.getCommand();
			for (String argument : configuration.getArguments()) {
				spoolName += " " + argument;
			}
			this.in = Spooler.start(delegate.getInputStream(), context.getStandardOutput(), false, "stdout: " + spoolName);
			this.err = Spooler.start(delegate.getErrorStream(), context.getStandardError(), false, "stderr: " + spoolName);
			this.stdin = context.getStandardInput();
			LOG.log(Level.FINEST, "Stack trace", new Throwable("Starting input spooler"));
			Spooler.start(this.stdin, inonit.script.runtime.io.Streams.Bytes.Flusher.ALWAYS.decorate(delegate.getOutputStream()), true, "stdin from " + this.stdin + ": " + spoolName);
		}

		Integer getPid() {
			try {
				java.lang.reflect.Field field = delegate.getClass().getDeclaredField("pid");
				field.setAccessible(true);
				return (Integer)field.get(delegate);
			} catch (NoSuchFieldException e) {
				return null;
			} catch (IllegalAccessException e) {
				return null;
			}
		}

		int waitFor() throws InterruptedException {
			LOG.log(Level.FINE, "Waiting for %s", delegate);
			int rv = delegate.waitFor();
			LOG.log(Level.FINE, "Exit status for %s is %d", new Object[] { delegate, rv });
			//	If we were passing our own System.in to a subprocess directly, it does not make sense to close it just because the
			//	subprocess ended. On the other hand, if we are sending another input stream, we should close it, both to save
			//	resources and because there may be a non-daemon thread reading it.
			if (this.stdin != System.in) {
				try {
					LOG.log(Level.FINEST, "Closing input stream being sent to subprocess: %s", this.stdin);
					this.stdin.close();
					LOG.log(Level.FINEST, "Closed input stream being sent to subprocess: %s", this.stdin);
				} catch (IOException e) {
					LOG.log(Level.FINEST, "Error closing input stream being sent to subprocess: %s %s", new Object[] { this.stdin, e });
					throw new RuntimeException(e);
				}
			}
			LOG.log(Level.FINEST, "Joining output threads ...");
			this.in.join();
			LOG.log(Level.FINEST, "Exhausted output stream");
			this.err.join();
			LOG.log(Level.FINEST, "Exhausted error stream; returning subprocess exit status: %d", rv);
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

	static Command create(Configuration configuration) {
		Command rv = new Command();
		rv.configuration = configuration;
		return rv;
	}

	private Configuration configuration;

	private Command() {
	}

	private static <S extends Object> List<S> asList(S[] array) {
		if (array == null) return null;
		return Arrays.asList(array);
	}

	private static Process launch(Context context, Configuration configuration) throws IOException {
		String[] command = configuration.cmdarray();
		for (int i=0; i<command.length; i++) {
			if (command[i] == null) {
				throw new NullPointerException("Command argument " + i + " must not be null.");
			}
		}
		LOG.log(Level.CONFIG, "Launching subprocess: %s env=%s pwd=%s", new Object[] { asList(command), asList(context.envp()), context.getWorkingDirectory() });
		return new Process(
			Runtime.getRuntime().exec( command, context.envp(), context.getWorkingDirectory() )
			,context
			,configuration
		);
	}

	private void execute(Context context, Listener listener) {
		try {
			Process p = launch(context, configuration);
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

	Listener execute(Context context) {
		Listener listener = new Listener();
		execute(context, listener);
		return listener;
	}

	Subprocess start(Context context) throws IOException {
		return new Subprocess(launch(context, configuration));
	}

	Result getResult() {
		Result result = new Result();
		execute(result.getContext(), result.getListener());
		return result;
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

		// private IOException e;

		Spooler(InputStream in, OutputStream out, boolean closeOnEnd) {
			this.in = in;
			this.out = out;
			this.closeOnEnd = closeOnEnd;
		}

		// IOException failure() {
		// 	return e;
		// }

		public void run() {
			int i;
			try {
				while( (i = in.read()) != -1 ) {
					out.write(i);
					//	We auto-flush after every byte to ensure that consumers of the output will eventually receive something
					//	The particular case in question was when this loop was running inside the jsh launcher and consuming output
					//	flushed by the loader, but was never flushing it to its own stdout
					//	TODO	could make this much more configurable and/or complex
					out.flush();
				}
				if (closeOnEnd) {
					out.close();
				}
			} catch (IOException e) {
				// this.e = e;
			}
		}
	}
}