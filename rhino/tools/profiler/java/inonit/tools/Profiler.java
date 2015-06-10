//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.tools;

import java.lang.instrument.*;
import java.util.*;

public class Profiler {
	private static Profiler javaagent = new Profiler();

	public static Profiler javaagent() {
		return javaagent;
	}

	private HashMap<Thread,Timing> profiles = new HashMap<Thread,Timing>();

	private Timing getProfile() {
		if (profiles.get(Thread.currentThread()) == null) {
			synchronized(profiles) {
				profiles.put(Thread.currentThread(), new Timing());
			}
		}
		return profiles.get(Thread.currentThread());
	}

	private void startImpl(Code code) {
		getProfile().start(code);
	}

	private static class CustomCode extends Code {
		private Object o;

		CustomCode(Object o) {
			this.o = o;
		}

		public String toString() {
			return o.toString();
		}

		public int hashCode() {
			return o.hashCode();
		}

		public boolean equals(Object other) {
			if (other == null) return false;
			if (!(other instanceof CustomCode)) return false;
			return o.equals(((CustomCode)other).o);
		}
	}

	public void start(Object o) {
		startImpl(new CustomCode(o));
	}

	public static class CustomFunction extends Code {
		private String data;
		private Object function;

		CustomFunction(String data, Object function) {
			this.data = data;
			this.function = function;
		}

		public String toString() {
			return this.data;
		}

		public boolean equals(Object other) {
			if (other == null) return false;
			if (!(other instanceof CustomFunction)) return false;
			return this.function.equals(((CustomFunction)other).function);
		}

		public int hashCode() {
			return function.hashCode();
		}

		public String getMetadata() {
			return data;
		}

		public Object getFunction() {
			return function;
		}
	}

	public void start(String name, Object function) {
		startImpl(new CustomFunction(name, function));
	}

	public void start(String declaring, String methodName, String signature, Object target) {
		startImpl(new MethodCode(declaring, methodName, signature));
	}

	private void stopImpl() {
		getProfile().stop();
	}

	public void stop(Object o) {
		stopImpl();
	}

	public void stop(String name, Object function) {
		stopImpl();
	}

	public void stop(String declaring, String methodName, String signature, Object target) {
		//	TODO	check to verify it is the same invocation?
		stopImpl();
	}

	public static class Timing {
		private Node root = new Node(this);
		private LinkedList<Node> stack = new LinkedList<Node>();

		Timing() {
			stack.push(root);
		}

		Node start(Code code) {
			Node rv = stack.peek().getChild(code);
			stack.push(rv);
			rv.start();
			return rv;
		}

		void stop(Node node) {
			stack.peek().stop();
			if (stack.peek() != node) {
				throw new RuntimeException("Stack is not correct.");
			}
			stack.pop();
		}

		void stop() {
			stop(stack.peek());
		}

		void finish() {
			while(stack.peek() != null) {
				stack.peek().stop();
				stack.pop();
			}
			root.finish();
		}

		public Node getRoot() {
			return root;
		}
	}

	public static class Node {
		private Timing parent;
		//	TODO	unused instance variable
		private Code code;

		protected Statistics statistics;
		private HashMap<Code,Node> children = new HashMap<Code,Node>();

		Node(Timing parent, Code code) {
			this.parent = parent;
			this.code = code;
			this.statistics = new CountingStatistics();
		}

		Node(Timing parent) {
			this.parent = parent;
			this.statistics = new TimingStatistics();
		}

		Node(Timing parent, Statistics statistics) {
			this.parent = parent;
			this.statistics = statistics;
		}

		static class Self extends Node {
			Self(Timing parent, int time) {
				super(parent, new SelfStatistics(time));
			}
		}

		//	TODO	can getChild, start() be combined?

		Node getChild(Code code) {
			if (children.get(code) == null) {
				children.put(code,new Node(parent,code));
			}
			return children.get(code);
		}

		void start() {
			statistics.start();
		}

		void stop() {
			statistics.stop();
		}

		void finish() {
			statistics.finish(children.values());
		}

		public Object getCode() {
			if (code instanceof CustomCode) {
				return ((CustomCode)code).o;
			} else {
				return code;
			}
		}

		public Statistics getStatistics() {
			return statistics;
		}

		public Node[] getChildren() {
			return children.values().toArray(new Node[0]);
		}
	}

	public static abstract class Code {
		@Override public abstract String toString();
		@Override public abstract int hashCode();
		@Override public abstract boolean equals(Object o);
	}

	public static class MethodCode extends Code {
		private String className;
		private String methodName;
		private String signature;

		MethodCode(Class c, String methodName, Class[] signature) {
			this.className = c.getName();
			String s = "";
			for (int i=0; i<signature.length; i++) {
				s += signature[i].getName();
				if (i+1 != signature.length) {
					s += ",";
				}
			}
			this.methodName = methodName;
			this.signature = s;
		}

		MethodCode(String className, String methodName, String signature) {
			this.className = className;
			this.methodName = methodName;
			this.signature = signature;
		}

		public String toString() {
			return className + " " + methodName + " " + signature;
		}

		public int hashCode() {
			return toString().hashCode();
		}

		public boolean equals(Object o) {
			if (o == null) return false;
			if (!(o instanceof MethodCode)) return false;
			return o.toString().equals(toString());
		}

		public String getClassName() {
			return className;
		}

		public String getMethodName() {
			return methodName;
		}

		public String getSignature() {
			return signature;
		}
	}

	public static abstract class Statistics {
		abstract void start();
		abstract void stop();
		abstract void finish(Collection<Node> children);
		public abstract int getCount();
		public abstract long getElapsed();
	}

	public static class CountingStatistics extends Statistics {
		private int count;
		private long elapsed;
		private long start;

		void start() {
			count++;
			start = System.currentTimeMillis();
		}

		void stop() {
			elapsed += System.currentTimeMillis() - start;
		}

		void finish(Collection<Node> nodes) {
		}

		public int getCount() {
			return count;
		}

		public long getElapsed() {
			return elapsed;
		}
	}

	public static class TimingStatistics extends Statistics {
		private long elapsed;

		void start() {
		}

		void stop() {
		}

		void finish(Collection<Node> children) {
			for (Node node : children) {
				elapsed += node.getStatistics().getElapsed();
			}
		}

		public int getCount() {
			return 1;
		}

		public long getElapsed() {
			return elapsed;
		}
	}

	public static class SelfStatistics extends Statistics {
		private long elapsed;

		SelfStatistics(long elapsed) {
			this.elapsed = elapsed;
		}

		void start() {
		}

		void stop() {
		}

		void finish(Collection<Node> children) {
		}

		public int getCount() {
			return 0;
		}

		public long getElapsed() {
			return elapsed;
		}
	}

	private static class Configuration {
		private boolean debug;
		private HashMap<String,Boolean> filters = new HashMap<String,Boolean>();

		Configuration() {
			filters.put("org.mozilla.javascript", false);
			filters.put("org.mozilla.classfile", false);
			filters.put("inonit.script.rhino.Engine$Profiler", false);
		}

		final void debug() {
			debug = true;
		}

		final void debug(String message) {
			if (debug) System.err.println(message);
		}

		final void exclude(String value) {
			filters.put(value, Boolean.FALSE);
		}

		public boolean profile(String className) {
			String filterKey = className.replaceAll("\\/", ".");
			while(filterKey.length() > 0) {
				if (filters.get(filterKey) != null) {
					return filters.get(filterKey).booleanValue();
				}
				if (filterKey.lastIndexOf("$") != -1) {
					filterKey = filterKey.substring(0, filterKey.lastIndexOf("$"));
				} else if (filterKey.lastIndexOf(".") != -1) {
					filterKey = filterKey.substring(0, filterKey.lastIndexOf("."));
				} else {
					filterKey = "";
				}
			}
			return true;
		}

		public boolean profile(javassist.CtBehavior behavior) {
			return true;
		}
	}

	private static class Transformer implements java.lang.instrument.ClassFileTransformer {
		private Configuration configuration;

		private javassist.ClassPool classes = new javassist.ClassPool();
		private HashSet<ClassLoader> added = new HashSet<ClassLoader>();

		Transformer(Configuration configuration) {
			this.configuration = configuration;
			classes.appendSystemPath();
		}

		private String quote(String literal) {
			return "\"" + literal + "\"";
		}

		public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined, java.security.ProtectionDomain protectionDomain, byte[] classfileBuffer) throws IllegalClassFormatException {
			if (protectionDomain == null) return null;
			//	Remove other classes loaded by the agent, but if we make this capable of being loaded separately, this may need to
			//	change; just do not know enough about the definition of ProtectionDomain
			if (protectionDomain.equals(Profiler.class.getProtectionDomain())) return null;
			if (loader.getParent() == null) return null;
			if (configuration.profile(className)) {
				configuration.debug("Profiling " + className + " in " + loader/* + " with protection domain " + protectionDomain*/);
				ClassLoader parent = loader.getParent();
				while(parent != null) {
					configuration.debug("Parent class loader: " + parent);
					parent = parent.getParent();
				}
				try {
					if (!added.contains(loader)) {
						added.add(loader);
						classes.appendClassPath(new javassist.LoaderClassPath((loader)));
					}
					javassist.CtClass c = classes.makeClass(new java.io.ByteArrayInputStream(classfileBuffer));
					ArrayList<javassist.CtBehavior> behaviors = new ArrayList<javassist.CtBehavior>();
					behaviors.addAll(Arrays.asList(c.getDeclaredBehaviors()));
					for (javassist.CtBehavior b : c.getDeclaredMethods()) {
						if (configuration.profile(b)) {
							if (java.lang.reflect.Modifier.isAbstract(b.getModifiers())) break;
							if (b instanceof javassist.CtMethod) {
								javassist.CtMethod m = (javassist.CtMethod)b;
							}
							String arguments;
							if (java.lang.reflect.Modifier.isStatic(b.getModifiers())) {
								arguments = "(" + quote(b.getDeclaringClass().getName()) + "," + quote(b.getName()) + "," + quote(b.getSignature()) + "," + "null" + ")";
							} else {
								arguments = "(" + quote(b.getDeclaringClass().getName()) + "," + quote(b.getName()) + "," + quote(b.getSignature()) + "," + "$0" + ")";
							}
							if (b.getParameterTypes().length > 0) {
								if (b.getParameterTypes()[0].subclassOf(classes.get("jdk.nashorn.internal.runtime.ScriptFunction"))) {
									arguments = "($1.toString(), $1)";
								}
							}
							String before = "inonit.tools.Profiler.javaagent().start" + arguments + ";";
							String after = "inonit.tools.Profiler.javaagent().stop" + arguments + ";";
							try {
								b.insertBefore(before);
								b.insertAfter(after);
								b.addCatch("{ " + after + "; throw $e; }", classes.getCtClass("java.lang.Throwable"));
							} catch (javassist.CannotCompileException e) {
								System.err.println("CannotCompileException: " + e.getMessage() + ": " + b.getDeclaringClass().getName() + "." + b.getName() + "(" + b.getSignature() + ")");
							}
						} else {
						}
					}
					return c.toBytecode();
				} catch (javassist.NotFoundException e) {
					e.printStackTrace();
					throw new RuntimeException(e);
				} catch (javassist.CannotCompileException e) {
					e.printStackTrace();
					throw new RuntimeException(e);
				} catch (java.io.IOException e) {
					e.printStackTrace();
					throw new RuntimeException(e);
				}
			} else {
				configuration.debug("Not profiling " + className);
				return null;
			}
		}
	}

	public static abstract class Profile {
		public abstract Thread getThread();
		public abstract Timing getTiming();
	}

	public static abstract class Listener {
		public static final Listener DEFAULT = new Listener() {
			private String getCaption(Code code, Node[] children) {
				if (code == null) {
					if (children.length == 0) {
						return "(self)";
					} else {
						return "(top)";
					}
				} else {
					return code.toString();
				}
			}

			private void dump(java.io.PrintWriter writer, String indent, Timing parent, Node node) {
				Statistics statistics = node.getStatistics();
				Code code = node.code;
				writer.println(indent + "elapsed=" + statistics.getElapsed() + " calls=" + statistics.getCount() + " " + getCaption(code, node.getChildren()));
				ArrayList<Node> list = new ArrayList<Node>(Arrays.asList(node.getChildren()));
				if (node.getChildren().length > 0 && statistics.getElapsed() > 0) {
					int sum = 0;
					for (Node n : list) {
						sum += n.statistics.getElapsed();
					}
					int self = (int)statistics.getElapsed() - sum;
					if (self > 0) {
						list.add(new Node.Self(parent,self));
					}
				}
				Collections.sort(list, new Comparator<Node>() {
					public int compare(Node o1, Node o2) {
						return (int)(o2.statistics.getElapsed() - o1.statistics.getElapsed());
					}
				});
				for (Node child : list) {
					dump(writer, "  " + indent, parent, child);
				}
			}

			@Override public void onExit(Profile[] profiles) {
				java.io.PrintWriter err = new java.io.PrintWriter(System.err, true);
				for (Profile profile : profiles) {
					err.println(profile.getThread().getName());
					dump(err, "", profile.getTiming(), profile.getTiming().getRoot());
				}
			}
		};

		public abstract void onExit(Profile[] profiles);
	}

	private ArrayList<Listener> listeners = new ArrayList<Listener>();

	public void addListener(Listener listener) {
		listeners.add(listener);
	}

	public static void premain(String agentArgs, Instrumentation inst) {
		Configuration configuration = new Configuration();
		String[] args = (agentArgs != null) ? agentArgs.split(",") : new String[0];
		System.getProperties().put(Profiler.class.getName() + ".args", args);
		for (String arg : args) {
			if (arg.startsWith("exclude=")) {
				String value = arg.substring(arg.indexOf("=")+1);
				configuration.exclude(value);
			}
			if (arg.equals("debug=true")) {
				System.err.println("Profiler debugging enabled...");
				configuration.debug();
			}
		}
		javaagent = new Profiler();
		System.err.println("Starting profiler; agentArgs = " + agentArgs + " ...");
		configuration.debug("java.ext.dirs=" + System.getProperty("java.ext.dirs"));
		configuration.debug("Profiler class: " + Profiler.class);
		configuration.debug("Profiler class loader: " + Profiler.class.getClassLoader());
		configuration.debug("Property inonit.tools.Profiler.args = " + System.getProperties().get("inonit.tools.Profiler.args"));
		inst.addTransformer(new Transformer(configuration));
		Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
			public void run() {
				synchronized(javaagent.profiles) {
					for (Timing timing : javaagent.profiles.values()) {
						timing.finish();
					}
				}

				ArrayList<Profile> profiles = new ArrayList<Profile>();
				synchronized(javaagent.profiles) {
					Set<Map.Entry<Thread,Timing>> set = javaagent.profiles.entrySet();
					for (final Map.Entry<Thread,Timing> entry : set) {
						profiles.add(new Profile() {
							@Override public Thread getThread() {
								return entry.getKey();
							}

							@Override public Timing getTiming() {
								return entry.getValue();
							}
						});
					}
					//	TODO	this basically re-sets all the timers so that the timing data, starting now, is unaffected by the
					//			listeners. But it would probably be better to somehow disable profiling altogether, by setting a state
					//			variable somewhere that shuts everything off
					javaagent.profiles.clear();
				}
				if (javaagent.listeners.size() == 0) {
					javaagent.listeners.add(Listener.DEFAULT);
				}
				Profile[] array = profiles.toArray(new Profile[profiles.size()]);
				for (Listener listener : javaagent.listeners) {
					listener.onExit(array);
				}
			}
		}));
	}
}