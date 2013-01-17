package inonit.tools;

import java.lang.instrument.*;
import java.util.*;

public class Profiler {
	private static Profiler javaagent = new Profiler();
	
	public static Profiler javaagent() {
		return javaagent;
	}
	
	private HashMap<Thread,Graph> profiles = new HashMap<Thread,Graph>();
	
	private Graph getProfile() {
		if (profiles.get(Thread.currentThread()) == null) {
			profiles.put(Thread.currentThread(), new Graph());
		}
		return profiles.get(Thread.currentThread());
	}
	
	private Invocation startImpl(Code code) {
		//System.err.println("Starting code: " + code);
		Graph profile = getProfile();
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
		if (declaring.equals("org.mozilla.javascript.InterpretedFunction") && (methodName.equals("exec"))) {
			startImpl(new ScriptCode(declaring, methodName, signature, target));
		} else {
			startImpl(new MethodCode(declaring, methodName, signature));
		}
	}
	
	public void stopImpl() {
		Graph profile = getProfile();
		//System.err.println("Ending node " + profile.stack.peek());
		profile.stop();
		//System.err.println("Ending invocation: " + invocation);
		//invocation.stop();
	}
	
	public void stop(Object o) {
		stopImpl();
	}
	
	public void stop(String declaring, String methodName, String signature, Object target) {
		//	TODO	check to verify it is the same invocation
		//	Invocation invocation = getProfile().getInvocation();
		stopImpl();
	}
	
	private static class Graph {
		private Node root = new Node(this);
		private LinkedList<Node> stack = new LinkedList<Node>();
		
		Graph() {
			stack.push(root);
		}
		
		void dump(java.io.PrintWriter writer) {
			root.dump(writer,"");
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
	}
	
	private static String getCaption(Code code, HashMap<Code,Node> children) {
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
		
	private static void dump(java.io.PrintWriter writer, String indent, Graph parent, Code code, Statistics statistics, HashMap<Code,Node> children) {
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
			node.dump(writer, "  " + indent);
		}		
	}
	
	private static class Node {
		private Graph parent;
		//	TODO	unused instance variable
		private Code code;
		
		protected Statistics statistics = new Statistics();
		private HashMap<Code,Node> children = new HashMap<Code,Node>();
		
		Node(Graph parent, Code code) {
			this.parent = parent;
			this.code = code;
		}
		
		Node(Graph parent) {
			this.parent = parent;
		}
		
		public String toString() {
			return "Node: " + code.toString();
		}
		
		static class Self extends Node {
			Self(Graph parent, int time) {
				super(parent);
				this.statistics.elapsed = time;
			}
		}
		
		void dump(java.io.PrintWriter writer, String indent) {
			Profiler.dump(writer, indent, parent, code, statistics, children);
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
	
	private static class ScriptCode extends Code {
		private String source;
		private String methodName;
		
		ScriptCode(String className, String methodName, String signature, Object target) {
			try {
				java.lang.reflect.Method decompile = target.getClass().getSuperclass().getDeclaredMethod("decompile", int.class, int.class);
				decompile.setAccessible(true);
				this.source = (String)decompile.invoke(target,0,0);
			} catch (NoSuchMethodException e) {
				throw new RuntimeException(e);
			} catch (IllegalAccessException e) {
				throw new RuntimeException(e);
			} catch (java.lang.reflect.InvocationTargetException e) {
				throw new RuntimeException(e);
			} finally {
			}
			this.methodName = methodName;
		}
		
		public String toString() {
			return methodName + source;
		}
		
		public int hashCode() {
			return source.hashCode();
		}
		
		public boolean equals(Object o) {
			if (o == null) return false;
			if (!(o instanceof ScriptCode)) return false;
			return ((ScriptCode)o).source.equals(source);
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
			//	If the below is commented out, it leads to an enormous graph even for Hello World
			if (className.startsWith("org/mozilla/javascript/TokenStream")) return false;
			if (className.startsWith("org/mozilla/javascript/Parser")) return false;
			if (className.startsWith("org/mozilla/javascript/CodeGenerator")) return false;
			if (className.startsWith("org/mozilla/javascript/NodeTransformer")) return false;
			if (className.startsWith("org/mozilla/javascript/Node")) return false;
			if (className.startsWith("org/mozilla/javascript/IRFactory")) return false;
			if (className.startsWith("org/mozilla/javascript/ObjToIntMap")) return false;
			if (className.startsWith("org/mozilla/javascript/ObjArray")) return false;
			if (className.startsWith("org/mozilla/javascript/IdScriptableObject")) return false;
			if (className.startsWith("org/mozilla/javascript/NativeObject")) return false;
			if (className.startsWith("org/mozilla/javascript/NativeString")) return false;
			if (className.startsWith("org/mozilla/javascript/NativeArray")) return false;
			if (className.startsWith("org/mozilla/javascript/JavaMembers")) return false;
			if (className.startsWith("org/mozilla/javascript/ICode")) return false;
			if (className.startsWith("org/mozilla/javascript/ast/")) return false;
			if (className.startsWith("org/mozilla/javascript/jdk13/")) return false;
			
//			if (className.startsWith("org/mozilla/javascript/InterpretedFunction")) return true;
			if (className.startsWith("org/mozilla/javascript/")) return false;
			if (className.startsWith("inonit/script/rhino/Engine$Profiler")) return false;
			return true;
		}
		
		public boolean profile(javassist.CtBehavior behavior) {
//			if (behavior.getDeclaringClass().getName().equals("org.mozilla.javascript.InterpretedFunction")) {
//				return behavior.getName().equals("exec");
//			}
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
		
		private void trace(String message) {
			System.err.println(message);
		}
		
		private String quote(String literal) {
			return "\"" + literal + "\"";
		}

		public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined, java.security.ProtectionDomain protectionDomain, byte[] classfileBuffer) throws IllegalClassFormatException {
//			System.err.println("Examine: " + className);
			if (protectionDomain == null) return null;
			if (protectionDomain.equals(Profiler.class.getProtectionDomain())) return null;
//			System.err.println("class: " + className + " location: " + protectionDomain);
			if (configuration.profile(className)) {
//				System.err.println("Transform: " + className);
				try {
					if (!added.contains(loader)) {
						added.add(loader);
						classes.appendClassPath(new javassist.LoaderClassPath((loader)));
					}
					javassist.CtClass c = classes.makeClass(new java.io.ByteArrayInputStream(classfileBuffer));
//					System.err.println("1: " + className);
					ArrayList<javassist.CtBehavior> behaviors = new ArrayList<javassist.CtBehavior>();
//					System.err.println("2: " + className);
					behaviors.addAll(Arrays.asList(c.getDeclaredBehaviors()));
//					trace("3: " + className);
					for (javassist.CtBehavior b : c.getDeclaredMethods()) {
						if (configuration.profile(b)) {
	//						trace("4: " + b);
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
	//						System.err.println(before);
							String after = "inonit.tools.Profiler.javaagent().stop" + arguments + ";";
							try {
								b.insertBefore(before);
								b.insertAfter(after);
								b.addCatch("{ " + after + "; throw $e; }", classes.getCtClass("java.lang.Throwable"));
							} catch (javassist.CannotCompileException e) {
								System.err.println("CannotCompileException: " + e.getMessage() + ": " + b.getDeclaringClass().getName() + "." + b.getName() + "(" + b.getSignature() + ")");
	//							e.printStackTrace();
							}
						}
					}
//					trace("5: " + b);
//					System.err.println("Transformed: " + className);
//					return null;
					return c.toBytecode();
				} catch (javassist.NotFoundException e) {
					e.printStackTrace();
					throw new RuntimeException(e);
				} catch (javassist.CannotCompileException e) {
					e.printStackTrace();
					return null;
					//throw new RuntimeException(e);
				} catch (java.io.IOException e) {
					e.printStackTrace();
					throw new RuntimeException(e);
				}
			} else {
				return null;
			}
		}
	}
	
	public static void premain(String agentArgs, Instrumentation inst) {
		javaagent = new Profiler();
		System.err.println("Starting profiler ...");
		inst.addTransformer(new Transformer(new Configuration()));
		Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
			public void run() {
				java.io.PrintWriter err = new java.io.PrintWriter(System.err, true);
				Set<Map.Entry<Thread,Graph>> entries = javaagent.profiles.entrySet();
				for (Map.Entry<Thread,Graph> e : entries) {
					err.println(e.getKey().getName());
					e.getValue().dump(err);
				}
			}
		}));
	}
}
