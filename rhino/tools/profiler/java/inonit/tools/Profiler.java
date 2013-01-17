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
			profiles.put(Thread.currentThread(), new Timing());
		}
		return profiles.get(Thread.currentThread());
	}
	
	private Invocation startImpl(Code code) {
		//System.err.println("Starting code: " + code);
		Timing profile = getProfile();
		Node node = profile.start(code);
		Invocation rv = new Invocation(node);
		profile.setInvocation(rv);
		return rv;
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
	
	public void start(String declaring, String methodName, String signature, Object target) {
		startImpl(new MethodCode(declaring, methodName, signature));
	}
	
	private void stopImpl() {
		getProfile().stop();
	}
	
	public void stop(Object o) {
		stopImpl();
	}
	
	public void stop(String declaring, String methodName, String signature, Object target) {
		//	TODO	check to verify it is the same invocation?
		stopImpl();
	}
	
	private static class Timing {
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
		
		private Invocation invocation;
		
		void setInvocation(Invocation invocation) {
			this.invocation = invocation;
		}
		
		Invocation getInvocation() {
			return invocation;
		}
		
		public Node getRoot() {
			return root;
		}
	}
	
	private static class Node {
		private Timing parent;
		//	TODO	unused instance variable
		private Code code;
		
		protected Statistics statistics = new Statistics();
		private HashMap<Code,Node> children = new HashMap<Code,Node>();
		
		Node(Timing parent, Code code) {
			this.parent = parent;
			this.code = code;
		}
		
		Node(Timing parent) {
			this.parent = parent;
		}
		
		static class Self extends Node {
			Self(Timing parent, int time) {
				super(parent);
				this.statistics.elapsed = time;
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
	}
	
	private static abstract class Code {
	}
	
	private static class MethodCode extends Code {
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
	}
	
	private static class Statistics {
		private int count;
		private long elapsed;
		private long start;
		
		public void start() {
			count++;
			start = System.currentTimeMillis();
		}
		
		public void stop() {
			elapsed += System.currentTimeMillis() - start;
		}
	}
	
	//	TODO	should this go away?
	public static class Invocation {
		private Node node;
		
		Invocation(Node node) {
			this.node = node;
		}
		
		public String toString() {
			return this.node.code.toString();
		}
		
		void stop() {
			this.node.stop();
		}
	}
	
	private static class Configuration {
		public boolean profile(String className) {
			if (className.startsWith("org/mozilla/javascript/")) return false;
			if (className.startsWith("inonit/script/rhino/Engine$Profiler")) return false;
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
			if (configuration.profile(className)) {
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
							String before = "inonit.tools.Profiler.javaagent().start" + arguments + ";";
							String after = "inonit.tools.Profiler.javaagent().stop" + arguments + ";";
							try {
								b.insertBefore(before);
								b.insertAfter(after);
								b.addCatch("{ " + after + "; throw $e; }", classes.getCtClass("java.lang.Throwable"));
							} catch (javassist.CannotCompileException e) {
								System.err.println("CannotCompileException: " + e.getMessage() + ": " + b.getDeclaringClass().getName() + "." + b.getName() + "(" + b.getSignature() + ")");
							}
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
				return null;
			}
		}
	}
	
	public static abstract class Profile {
		public abstract Thread getThread();
		public abstract Timing getGraph();
	}
	
	public static abstract class Listener {
		public static final Listener DEFAULT = new Listener() {
			private String getCaption(Code code, HashMap<Code,Node> children) {
				if (code == null) {
					if (children.size() == 0) {
						return "(self)";
					} else {
						return "(top)";
					}
				} else {
					return code.toString();
				}
			}

			private void dump(java.io.PrintWriter writer, String indent, Timing parent, Code code, Statistics statistics, HashMap<Code,Node> children) {
				writer.println(indent + "elapsed=" + statistics.elapsed + " calls=" + statistics.count + " " + getCaption(code, children));
				Collection<Node> values = children.values();
				ArrayList<Node> list = new ArrayList<Node>(values);
				if (values.size() > 0 && statistics.elapsed > 0) {
					int sum = 0;
					for (Node n : list) {
						sum += n.statistics.elapsed;
					}
					int self = (int)statistics.elapsed - sum;
					if (self > 0) {
						list.add(new Node.Self(parent,self));
					}
				}
				Collections.sort(list, new Comparator<Node>() {
					public int compare(Node o1, Node o2) {
						return (int)(o2.statistics.elapsed - o1.statistics.elapsed);
					}
				});
				for (Node node : list) {
					dump(writer, "  " + indent, parent, node.code, node.statistics, node.children);
				}		
			}

			@Override public void onExit(Profile[] profiles) {
				java.io.PrintWriter err = new java.io.PrintWriter(System.err, true);
				for (Profile profile : profiles) {
					err.println(profile.getThread().getName());
					dump(err, "", profile.getGraph(), profile.getGraph().getRoot().code, profile.getGraph().getRoot().statistics, profile.getGraph().getRoot().children);
				}
			}
		};
		
		public abstract void onExit(Profile[] profiles);
	}
	
	private ArrayList<Listener> listeners = new ArrayList<Listener>();
	
	public static void premain(String agentArgs, Instrumentation inst) {
		javaagent = new Profiler();
		System.err.println("Starting profiler ...");
		inst.addTransformer(new Transformer(new Configuration()));
		Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
			public void run() {
				ArrayList<Profile> profiles = new ArrayList<Profile>();
				for (final Map.Entry<Thread,Timing> entry : javaagent.profiles.entrySet()) {
					profiles.add(new Profile() {
						@Override public Thread getThread() {
							return entry.getKey();
						}

						@Override public Timing getGraph() {
							return entry.getValue();
						}
					});
				}
				//	TODO	this basically re-sets all the timers so that the timing data, starting now, is unaffected by the
				//			listeners. But it would probably be better to somehow disable profiling altogether, by setting a state
				//			variable somewhere that shuts everything off
				javaagent.profiles.clear();
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
