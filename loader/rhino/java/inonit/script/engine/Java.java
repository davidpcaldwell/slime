package inonit.script.engine;

import java.io.*;
import java.net.*;
import java.util.*;

import javax.lang.model.element.*;
import javax.tools.*;

public class Java {
	static abstract class Classes {
		abstract JavaFileObject forOutput(String className);
		abstract Compiled getCompiledClass(String className);
		
		static Classes memory() {
			return new MemoryClasses();
		}
	}
	
	static abstract class Compiled implements JavaFileObject {
		abstract byte[] getBytes();
	}
	
	private static class MemoryClasses extends Classes {
		private Map<String,OutputClass> classes = new HashMap<String,OutputClass>();

		private class OutputClass extends Compiled {
			private String name;
			private ByteArrayOutputStream out;

			OutputClass(String name) {
				this.name = name;
			}

			public Kind getKind() {
				return Kind.CLASS;
			}

			public boolean isNameCompatible(String simpleName, Kind kind) {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public NestingKind getNestingKind() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Modifier getAccessLevel() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public URI toUri() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public String getName() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public InputStream openInputStream() throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public OutputStream openOutputStream() throws IOException {
				out = new ByteArrayOutputStream();
				return out;
			}

			public Reader openReader(boolean ignoreEncodingErrors) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public CharSequence getCharContent(boolean ignoreEncodingErrors) throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public Writer openWriter() throws IOException {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public long getLastModified() {
				throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
			}

			public boolean delete() {
				classes.put(name, null);
				return true;
			}

			byte[] getBytes() {
				return out.toByteArray();
			}
		}

		JavaFileObject forOutput(String className) {
			//System.err.println("forOutput: " + className);
			if (false && classes.get(className) != null) {
				throw new UnsupportedOperationException("Duplicate!");
			}
			classes.put(className, new OutputClass(className));
			return classes.get(className);
		}
		
		Compiled getCompiledClass(String className) {
			return classes.get(className);
		}

//		Code.Source.File getCompiledClass(String className) {
//			//System.err.println("getCompiledClass: " + className);
//			if (classes.get(className) != null) {
//				final Compiled oc = classes.get(className);
//				return new Code.Source.File() {
//					@Override public Code.Source.URI getURI() {
//						return Code.Source.URI.create(oc.toUri());
//					}
//
//					@Override public String getSourceName() {
//						return null;
//					}
//
//					@Override public InputStream getInputStream() {
//						return new ByteArrayInputStream(oc.getBytes());
//					}
//
//					@Override public Long getLength() {
//						//	TODO	length of array
//						return null;
//					}
//
//					@Override public Date getLastModified() {
//						//	TODO	might as well store
//						return null;
//					}
//				};
//			} else {
//				return null;
//			}
//		}
	}

}
