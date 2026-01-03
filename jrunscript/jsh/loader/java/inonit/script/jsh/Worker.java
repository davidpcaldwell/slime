//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.jsh;

import java.io.File;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.logging.Level;
import java.util.logging.Logger;

import inonit.script.jsh.Shell.Invocation;

public class Worker {
	private static final Logger LOG = Logger.getLogger(Worker.class.getName());

	private Shell parent;
	private File source;
	private String[] arguments;
	private Event.Listener toParent;
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

	void start() {
		parent.events.add(this);
		LOG.log(Level.FINEST, "Starting worker ...");
		Invocation invocation = Shell.Invocation.create(Shell.Script.create(source), arguments);
		this.shell = parent.subshell(parent.getEnvironment(), invocation);
		shell.events.canFinish = false;
		shell.parent = parent.events;
		shell.parentListener = this.toParent;
		LOG.log(Level.FINEST, "Created worker shell " + shell);
		new Thread(
			new Runnable() {
				public void run() {
					try {
						LOG.log(Level.FINEST, "Starting worker shell evaluation.");
						parent.subshell(
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
			LOG.log(Level.FINEST, "Constructed EventLoop: " + this);
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
			LOG.log(Level.FINEST, this + ".isAlive(): workers=" + workers.size() + " events=" + events.size() + " canFinish=" + canFinish);
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
					LOG.log(Level.FINEST, "Starting event loop " + EventLoop.this + " in thread " + Thread.currentThread());
					while(isAlive()) {
						LOG.log(Level.FINEST, "Begin take() in " + this);
						Event.Outgoing event = take();
						LOG.log(Level.FINEST, "Finished take() in " + this);
						if (event != null) {
							LOG.log(Level.FINEST, "Event loop " + EventLoop.this + " got " + event.event.json);
							event.dispatch();
						}
					}
					LOG.log(Level.FINEST, "Finishing event loop " + EventLoop.this + " in thread " + Thread.currentThread().getName());
				}
			};
		}
	}
}
