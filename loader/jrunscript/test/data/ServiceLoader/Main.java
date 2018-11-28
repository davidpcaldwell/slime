import java.util.*;

public class Main {
	public static void main(String[] args) {
		ServiceLoader<Runnable> runnableLoader = ServiceLoader.load(Runnable.class);
		for (Runnable r : runnableLoader) {
			System.out.println(r.getClass().getName());
		}
	}
}