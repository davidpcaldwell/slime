//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh;

import java.io.*;
import java.util.*;
import java.util.logging.*;

import inonit.script.runtime.io.*;
import inonit.system.*;
import inonit.script.engine.*;

public class Shell {
	private static final Logger LOG = Logger.getLogger(Shell.class.getName());

	public static abstract class Configuration {
		public static Shell.Configuration create(final Installation installation, final Environment configuration, final Invocation invocation) {
			return new Shell.Configuration() {
				@Override public Installation getInstallation() {
					return installation;
				}

				@Override public Environment getEnvironment() {
					return configuration;
				}

				@Override public Invocation getInvocation() {
					return invocation;
				}
			};
		}

		public abstract Installation getInstallation();

		public abstract Environment getEnvironment();

		public abstract Invocation getInvocation();

		final Configuration subshell(final Environment environment, final Invocation invocation) {
			final Installation installation = getInstallation();
			return new Configuration() {
				@Override public Installation getInstallation() {
					return installation;
				}

				@Override public Environment getEnvironment() {
					return environment;
				}

				@Override public Invocation getInvocation() {
					return invocation;
				}
			};
		}
	}

	public static Shell create(Configuration configuration, Engine engine) {
		Shell rv = new Shell();
		rv.configuration = configuration;
		rv.engine = engine;
		return rv;
	}

	private Configuration configuration;
	private Engine engine;

	private Shell() {
		LOG.log(Level.FINEST, "Shell = " + this + " events = " + this.events);
	}

	private Loader.Classes.Interface classpath;

	final void setClasspath(Loader.Classes.Interface classpath) {
		this.classpath = classpath;
	}

	public Code.Loader getJshLoader() {
		return configuration.getInstallation().getJshLoader();
	}

	//	TODO	Simplify handling of CoffeeScript by collapsing the next two methods and their invocations

	//	TODO	Used in jsh.js to retrieve CoffeeScript
	public Code.Loader.Resource getLibrary(String path) {
		Code.Loader plugins = configuration.getInstallation().getLibraries();
		try {
			return plugins.getFile(path);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	//	TODO	this is necessary still because of the fact that Code.Loader-based .jar files do not correctly implement
	//			java.util.ServiceLoader, so JAR files must be added to the classpath using a special API, so they must be added
	//			as java.io.File objects.
	public File getLibraryFile(String path) {
		return configuration.getInstallation().getLibraryFile(path);
	}

	private Loader loader = new Loader() {
		private Streams streams = new Streams();

		//	TODO	push back out into invoking code; appears to be used only by jsh/loader/nashorn.js
		public String getCoffeeScript() throws IOException {
			Code.Loader.Resource _file = configuration.getInstallation().getLibraries().getFile("coffee-script.js");
			if (_file == null) return null;
			return streams.readString(_file.getReader());
		}

		public String getLoaderCode(String path) throws IOException {
			Code.Loader.Resource file = configuration.getInstallation().getPlatformLoader().getFile(path);
			if (file == null) throw new NullPointerException("File not found at " + path + " in " + configuration.getInstallation().getPlatformLoader());
			return streams.readString(configuration.getInstallation().getPlatformLoader().getFile(path).getReader());
		}

		public Loader.Classes.Interface getClasspath() {
			return Shell.this.classpath;
		}

		private static final String TSC_PATH = "bin/tsc";

		private File getTscPath() {
			return configuration.getInstallation().getLibraryFile("node/" + TSC_PATH);
		}

		private File getNodeBinPath() {
			return configuration.getInstallation().getLibraryFile("node/bin");
		}

		private File createTemporaryDirectory(String prefix) throws IOException {
			File rv = File.createTempFile(prefix, null);
			rv.delete();
			rv.mkdirs();
			return rv;
		}

		public Loader.Typescript getTypescript() throws IOException {
			Code.Loader.Resource tsc = configuration.getInstallation().getLibraries().getFile("node/" + TSC_PATH);
			if (tsc != null) {
				return new Loader.Typescript() {
					@Override public String compile(String code) throws IOException {
						try {
							//	In unbuilt shell, these worked without 'final' annotation, but in test suite, they did not
							final File tmp = createTemporaryDirectory("tsc");
							final File ts = new File(tmp, "code.ts");
							streams.writeString(code, new FileOutputStream(ts));
							File js = new File(tmp, "code.js");
							OperatingSystem.get().run(
								new Command.Context() {
									@Override public File getWorkingDirectory() {
										return tmp;
									}

									@Override public Map<String,String> getSubprocessEnvironment() {
										Map<String,String> underlying = OperatingSystem.Environment.SYSTEM.getMap();
										HashMap<String,String> rv = new HashMap<String,String>();
										rv.putAll(underlying);
										rv.put("PATH", rv.get("PATH") + File.pathSeparator + getNodeBinPath());
										return rv;
									}

									@Override public InputStream getStandardInput() {
										return Streams.Null.INPUT_STREAM;
									}

									@Override public OutputStream getStandardOutput() {
										return System.out;
									}

									@Override public OutputStream getStandardError() {
										return System.err;
									}
								},
								new Command.Configuration() {
									@Override public String getCommand() {
										try {
											File file = getTscPath();
											if (file == null) throw new RuntimeException(
												"tsc file is null, even though tsc resource was " + tsc
												+ "\nand is " + configuration.getInstallation().getLibraries().getFile("node/" + TSC_PATH)
												+ "\nlibraries = " + configuration.getInstallation().getLibraries()
											);
											return file.getCanonicalPath();
										} catch (IOException e) {
											throw new RuntimeException(e);
										}
									}

									@Override public String[] getArguments() {
										try {
											return new String[] {
												"--outDir", tmp.getCanonicalPath(),
												//	--module ES6 basically leaves the code alone if it exports type definitions,
												//	which is the one kind of export we want to use right now
												"--module", "ES6",
												ts.getCanonicalPath()
											};
										} catch (IOException e) {
											throw new RuntimeException(e);
										}
									}
								}
							);
							String compiled = streams.readString(new FileReader(js));
							compiled = compiled.replace("export {};", "/* REMOVED BY JSH LOADER: $export {}; */");
							return compiled;
						} catch (FileNotFoundException e) {
							e.printStackTrace();
							throw e;
						} catch (NullPointerException e) {
							e.printStackTrace();
							throw e;
						}
					}
				};
			}
			return null;
		}
	};

	public Loader getLoader() {
		return loader;
	}

	public Shell subshell(Environment environment, Shell.Invocation invocation) {
		return create(this.configuration.subshell(environment, invocation), engine);
	}

	public final Environment getEnvironment() {
		return configuration.getEnvironment();
	}

	public final Shell.Invocation getInvocation() {
		return configuration.getInvocation();
	}

	private Object $host;

	public final void setRuntime(Object object) {
		this.$host = object;
	}

	public final Object runtime() {
		return $host;
	}

	//	TODO	certainly appears this can be merged with Code.Loader.Resource, now that Code.Loader.Resource has concept of URI
	public static abstract class Script {
		private static Script create(final Code.Loader.Resource delegate, final java.net.URI uri) {
			return new Script() {
				@Override public String toString() {
					return Script.class.getName() + " delegate=" + delegate + " uri=" + uri;
				}

				@Override public java.net.URI getUri() {
					return uri;
				}

				public Code.Loader.Resource getSource() {
					return delegate;
				}
			};
		}

		static Script create(File file) {
			return create(Code.Loader.Resource.create(file), file.toURI());
		}

		static Script create(Code.Loader.Resource delegate) {
			return create(delegate, null);
		}

		public abstract java.net.URI getUri();
		public abstract Code.Loader.Resource getSource();
	}

	public static abstract class Installation {
		public abstract Code.Loader getPlatformLoader();
		public abstract Code.Loader getJshLoader();
		public abstract Code.Loader getLibraries();

		/**
		 * Returns a {@link java.io.File} representing the file at the given location in the shell's library store, if a file at
		 * the given location exists and can be returned as a {@link java.io.File}.
		 *
		 * @param path A path within the installation's library store.
		 * @returns A {@link java.io.File} object for the given location if the file exists, or {@code null} if no such file exists
		 * or can be returned.
		 */
		public abstract File getLibraryFile(String path);

		public abstract Code.Loader[] getExtensions();

		public abstract Packaged getPackaged();
	}

	public Packaged getPackaged() {
		return configuration.getInstallation().getPackaged();
	}

	public static abstract class Packaged {
		static Packaged create(final Code.Loader code, final File file) {
			return new Packaged() {
				@Override public Code.Loader getCode() {
					return code;
				}

				@Override public File getFile() {
					return file;
				}
			};
		}

		/**
		 *
		 *	@return An object capable of loading modules and scripts bundled with a script.
		 */
		public abstract Code.Loader getCode();

		public abstract File getFile();
	}

	/**
	 * The execution environment for a {@link Shell}, including process environment, system properties, class loader,
	 * and standard I/O streams.
	 */
	public static abstract class Environment {
		static Environment create(
			final OperatingSystem.Environment environment,
			final Properties properties,
			final Stdio stdio,
			final Exit exit
		) {
			return new Environment() {
				@Override public OperatingSystem.Environment getEnvironment() {
					return environment;
				}

				@Override public Properties getSystemProperties() {
					return properties;
				}

				@Override public Stdio getStdio() {
					return stdio;
				}

				@Override public Exit getExit() {
					return exit;
				}
			};
		}

		public abstract OperatingSystem.Environment getEnvironment();
		public abstract Properties getSystemProperties();
		public abstract Stdio getStdio();
		public abstract Exit getExit();

		/**
		 * Used by shell implementations as a convenience to exit the shell via the {@link Exit} implementation.
		 *
		 * @param status The exit status of the shell.
		 */
		final void exit(int status) {
			getExit().accept(status);
		}

		/**
		 * A {Container} provides a {@link Shell} with a means of exiting with an <code>int</code> status code.
		 */
		public static abstract class Exit implements java.util.function.IntConsumer {
			public static final Exit VM = new Exit() {
				@Override public void accept(int status) {
					System.out.flush();
					System.err.flush();
					System.exit(status);
				}
			};

			//	TODO	Currently unused, but presumably intended to support a lighter-weight embedding of jsh inside something
			//			smaller than a full VM

			public static class Holder extends Exit {
				private Integer status;

				@Override public void accept(int status) {
					this.status = Integer.valueOf(status);
				}

				public Integer getExitCode(Run run, Shell.Configuration shell) {
					try {
						run.run(this, shell);
						return status;
					} catch (Throwable t) {
						run.threw(t);
						if (status == null) return Integer.valueOf(1);
						return status;
					}
				}

				public static abstract class Run {
					public abstract void threw(Throwable t);
					public abstract void run(Exit context, Shell.Configuration shell) throws Throwable;
				}
			}
		}

		final Loader.Classes.Configuration getClassesConfiguration() {
			return new Loader.Classes.Configuration() {
				@Override public boolean canCreateClassLoaders() {
					return true;
				}

				@Override public ClassLoader getApplicationClassLoader() {
					return Shell.class.getClassLoader();
				}

				@Override public java.io.File getLocalClassCache() {
					String value = Environment.this.getSystemProperties().getProperty("jsh.shell.classes");
					return (value != null) ? new File(new File(value), "modules") : null;
				}
			};
		}

		public static abstract class Stdio {
			static Stdio create(final InputStream in, final OutputStream out, final OutputStream err) {
				return new Stdio() {
					@Override public InputStream getStandardInput() {
						return in;
					}

					@Override public OutputStream getStandardOutput() {
						return out;
					}

					@Override public OutputStream getStandardError() {
						return err;
					}
				};
			}

			public abstract InputStream getStandardInput();
			public abstract OutputStream getStandardOutput();
			public abstract OutputStream getStandardError();
		}
	}

	public static abstract class Invocation {
		static Invocation create(final Script script, final String[] arguments) {
			//	TODO	probably should copy arguments array to make it immutable
			return new Invocation() {
				@Override public String toString() {
					String rv = String.valueOf(script);
					for (String s : arguments) {
						rv += " " + s;
					}
					return rv;
				}

				@Override public Script getScript() {
					return script;
				}

				@Override public String[] getArguments() {
					return arguments;
				}
			};
		}

		public abstract Script getScript();
		public abstract String[] getArguments();

		static class CheckedException extends Exception {
			CheckedException(String message) {
				super(message);
			}

			CheckedException(String message, Throwable cause) {
				super(message, cause);
			}
		}
	}

	public static class EventLoop {
		private static int INDEX = 0;

		private ArrayList<Event.Outgoing> events = new ArrayList<Event.Outgoing>();
		private HashSet<Worker> workers = new HashSet<Worker>();

		//	true for top level, false for workers until terminate() is called
		private boolean canFinish = true;

		private int index;

		public String toString() {
			return "EventLoop: " + index;
		}

		EventLoop() {
			this.index = ++INDEX;
			LOG.log(Level.FINEST, "New EventLoop: " + this);
		}

		synchronized void post(Event.Outgoing event) {
			LOG.log(Level.FINEST, "Posted event: " + event.event.json + " to " + this);
			events.add(event);
			notifyAll();
		}

		synchronized void add(Worker worker) {
			LOG.log(Level.FINEST, "Adding worker to " + this + " ...");
			workers.add(worker);
		}

		synchronized void remove(Worker worker) {
			LOG.log(Level.FINEST, "Removing worker from " + this + " ...");
			workers.remove(worker);
			if (workers.isEmpty()) {
				LOG.log(Level.FINEST, "Last worker terminated.");
			}
			notifyAll();
		}

		synchronized void terminate() {
			this.canFinish = true;
			notifyAll();
		}

		private boolean isAlive() {
			return !workers.isEmpty() || events.size() > 0 || !canFinish;
		}

		private synchronized Event.Outgoing take() {
			while(events.size() == 0 && isAlive()) {
				try {
					wait();
				} catch (InterruptedException e) {
					throw new RuntimeException(e);
				}
			}
			if (events.size() > 0) {
				Event.Outgoing rv = events.get(0);
				events.remove(0);
				return rv;
			} else {
				return null;
			}
		}

		/**
		 * "Runs" the event loop, essentially exhausting it and returning. Note that the event loop cannot finish until all Workers
		 * are terminated.
		 */
		public Runnable run() {
			return new Runnable() {
				public void run() {
					LOG.log(Level.FINEST, "Starting event loop " + EventLoop.this);
					while(isAlive()) {
						Event.Outgoing event = take();
						if (event != null) {
							LOG.log(Level.FINEST, "Event loop " + EventLoop.this + " got " + event.event.json);
							event.dispatch();
						}
					}
				}
			};
		}
	}

	public static class Event {
		static Event create(String json) {
			Event rv = new Event();
			rv.json = json;
			return rv;
		}

		private String json;

		public String json() {
			return json;
		}

		final void dispatch(Listener listener) {
			listener.on(this);
		}

		public static abstract class Listener {
			public abstract void on(Event event);
			public abstract void done();
		}

		static class Outgoing {
			static Outgoing create(Event event, Listener destination) {
				if (destination == null) throw new RuntimeException();
				Outgoing rv = new Outgoing();
				rv.event = event;
				rv.destination = destination;
				return rv;
			}

			private Event event;
			private Listener destination;

			final void dispatch() {
				destination.on(event);
			}
		}
	}

	public static class Worker {
		public static Worker create(Shell container, File source, String[] arguments, Shell.Event.Listener toParent) {
			return new Worker(container, source, arguments, toParent);
		}

		private Shell parent;
		private File source;
		private String[] arguments;
		private Shell.Event.Listener toParent;
		private Shell shell;

		Worker(Shell parent, File source, String[] arguments, Event.Listener toParent) {
			this.parent = parent;
			this.source = source;
			this.arguments = arguments;
			this.toParent = toParent;
		}

		public String toString() {
			return "Worker: " + source;
		}

		private boolean started = false;

		void start() {
			parent.events.add(this);
			LOG.log(Level.FINEST, "Starting worker ...");
			//	run worker in new thread and deliver events to events instance variable, then invoke done()
			Invocation invocation = Shell.Invocation.create(Shell.Script.create(source), arguments);
			this.shell = parent.subshell(parent.getEnvironment(), invocation);
			shell.events.canFinish = false;
			shell.parent = parent.events;
			shell.parentListener = this.toParent;
			LOG.log(Level.FINEST, "Created worker shell " + shell);
			Object lock = this;
			new Thread(
				new Runnable() {
					public void run() {
						try {
							LOG.log(Level.FINEST, "Starting worker shell evaluation.");
							parent.engine.main(
								shell
							);
							LOG.log(Level.FINEST, "Worker shell evaluation completed.");
						} catch (Invocation.CheckedException e) {
							throw new RuntimeException(e);
						}
					}
				}
			).start();
			synchronized(shell) {
				LOG.log(Level.FINEST, "Waiting for worker event loop to start.");
				while(!shell.eventLoopStarted) {
					try {
						shell.wait();
					} catch (InterruptedException e) {
						throw new RuntimeException(e);
					}
				}
				LOG.log(Level.FINEST, "Worker event loop started.");
			}
		}

		/**
		 * Used to send a message *to* this worker.
		 */
		public synchronized void postMessage(String json) {
			LOG.log(Level.FINEST, "Worker: Posting worker message " + json + " to " + shell);
			shell.events.post(Event.Outgoing.create(Event.create(json), shell.listener));
		}

		public synchronized void terminate() {
			shell.events.terminate();
			parent.events.remove(Worker.this);
		}
	}

	//	Used by both top-level and child shells, though termination rules are different
	private EventLoop events = new EventLoop();

	//	listener set by global onMessage call
	private Event.Listener listener;

	//	When onMessage is called in a worker
	public void onMessage(Event.Listener listener) {
		LOG.log(Level.FINEST, "Worker onMessage set " + listener);
		if (listener == null) throw new NullPointerException();
		this.listener = listener;
	}

	private EventLoop parent;
	private Event.Listener parentListener;

	private boolean eventLoopStarted = false;

	//	When postMessage is called in a worker, we need to put the event into the parent's event loop
	public void postMessage(String json) {
		LOG.log(Level.FINEST, "Worker posting message " + json);
		parent.post(Event.Outgoing.create(Event.create(json), parentListener));
	}

	public Worker worker(File source, String[] arguments, Event.Listener listener) {
		Worker rv = new Worker(this, source, arguments, listener);
		rv.start();
		return rv;
	}

	public void events() {
		LOG.log(Level.FINEST, "Starting event loop for " + this);
		synchronized(this) {
			eventLoopStarted = true;
			this.notifyAll();
		}
		events.run().run();
	}

	public static class Interface {
		private Installation installation;

		Interface(Installation installation, Loader.Classes.Interface classpath) {
			this.installation = installation;
		}

		//	TODO	probably needs a better name
		public Code.Loader[] getPluginSources() {
			return installation.getExtensions();
		}

		//	Used by rhino/shell plugin as helper for implementing subshell calls
		public Invocation invocation(File script, String[] arguments) {
			return Shell.Invocation.create(Shell.Script.create(script), arguments);
		}
	}

	public Interface getInterface() {
		if (classpath == null) throw new IllegalStateException();
		return new Interface(configuration.getInstallation(), classpath);
	}

	public static abstract class Engine {
		public abstract void main(Shell shell) throws Shell.Invocation.CheckedException;

		void shell(Shell.Configuration shell) throws Shell.Invocation.CheckedException {
			Thread.currentThread().setUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
				public void uncaughtException(Thread t, Throwable e) {
					Throwable error = e;
					java.io.PrintWriter writer = new java.io.PrintWriter(System.err,true);
					while(error != null) {
						writer.println(error.getClass().getName() + ": " + error.getMessage());
						StackTraceElement[] trace = error.getStackTrace();
						for (StackTraceElement line : trace) {
							writer.println("\t" + line);
						}
						error = error.getCause();
						if (error != null) {
							writer.print("Caused by: ");
						}
					}
				}
			});
			main(Shell.create(shell, this));
		}

		//	TODO	The cli() method appears to force VM containers; the embed() method and Runner class may have been intended
		//			to support another kind of container, but are currently unused

		// private class Runner extends Shell.Container.Holder.Run {
		// 	public void threw(Throwable t) {
		// 		t.printStackTrace();
		// 	}

		// 	public void run(Shell.Container context, Shell.Configuration shell) throws Shell.Invocation.CheckedException {
		// 		Engine.this.shell(context,shell);
		// 	}
		// }

		// private Integer embed(Shell.Configuration configuration) throws Shell.Invocation.CheckedException {
		// 	Shell.Container.Holder context = new Shell.Container.Holder();
		// 	return context.getExitCode(new Runner(), configuration);
		// }

	}

	public static abstract class Execution {
		private Shell shell;

		protected Execution(Shell shell) {
			this.shell = shell;
		}

		protected abstract Host.Factory getHostFactory();
		protected abstract Loader.Classes getClasses();

		protected final Code.Loader.Resource getJshLoaderFile(String path) {
			try {
				return shell.getJshLoader().getFile(path);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		/**
		 *	Must execute a script that creates and provides the SLIME jrunscript runtime object to the {@link Shell}. The
		 *  <code>Shell</code> will be present in the scope as the <code>$jsh</code. variable (see {@link #execute}).
		 */
		//	TODO	not quite DRY; all implementations must invoke $jsh.setRuntime; would be better if this somehow eval-ed and did
		//			that itself
		protected abstract void setJshRuntimeObject(Host.Program program);

		// protected abstract Integer run(Host.Program program);

		private Code.Loader.Resource getJshJs() {
			try {
				return shell.getJshLoader().getFile("jsh.js");
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		protected abstract ErrorHandling getErrorHandling();

		public static abstract class ErrorHandling {
			public abstract Integer run(Run r);

			public static abstract class Run {
				public abstract void run() throws javax.script.ScriptException;
			}
		}

		/**
		 *	@return The exit status of the main program.
		 */
		public final Integer execute() {
			LOG.log(Level.INFO, "Executing shell with %s", this);
			shell.setClasspath(getClasses().getInterface());
			final Host.Program program = new Host.Program();
			program.bind("$jsh", shell);
			this.setJshRuntimeObject(program);
			return getErrorHandling().run(new ErrorHandling.Run() {
				public void run() throws javax.script.ScriptException {
					program.run(getJshJs());
					Host.run(getHostFactory(), getClasses(), program);
				}
			});
		}
	}
}
