package inonit.jsh.test;

public class Directory {
	public static void main(String[] args) {
		System.out.print(System.getProperty("user.dir") + java.io.File.separator);
		System.out.flush();
	}
}
