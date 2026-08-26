---

title: SDA_Packages and Coupling

source: SDA_Packages and Coupling.pdf

converted: 2026-08-25

---

ADP: The Acyclic-Dependencies Principle Allow no cycles in the package dependency graph.

 Without cycles it is easy to compile, test and release ‘bottom-up’ when building the whole software  The packages in a cycle will become de facto a single package  compile-times increase  testing becomes difficult since a complete build is needed to test a single package

 developers can step over one another since they must be using exactly the same release of each other’s packages

The ‘Morning-After Syndrome’  Developers are modifying the same source files trying to make it work with the latest changes somebody else did → no stable version  Solution #1: the weekly build  developers work alone most of the week and integrate on Friday

 works on medium-sized projects  for bigger projects, the iteration gets longer (monthly build?) → rapid feedback is lost  Solution #2:  partition the development environment into releasable packages

 ensure ADP

Release-Control  Partition the development environment into releasable packages  package = unit of work  developer modifies the package privately  developer releases the working package  everyone else uses the released package while the developer can continue modifying it privately for the next release

 No developer is at the mercy of the others  everyone works independently on their own packages  everyone can decide independently when to adapt the packages to new releases of the packages they use

 no ‘big bang’ integration but small increments  To avoid the ‘morning-after syndrome’ the dependency tree must not have any cycles

Package Structure as a Directed Acyclic Graph MyApplication Message Task MyTasks Window Window Database Tasks MyDialogs Windows

Breaking the Cycle with Dependency Inversion Principle MyDialogs MyApplication X Y MyDialogs MyApplication «interface» X Y X Server

Breaking the Cycle with a New Package MyApplication Message Task MyTasks Window Window Database Tasks MyDialogs Windows NewPackage

Breaking the Cycle – a Corollary  The package structure cannot be designed top–down but it evolves as the system grows and changes  Package depency diagrams are not about the function of the application but they are a map to the buildability of the application

SDP: The Stable-Dependencies Principle Depend in the direction of stability.

 Designs cannot be completely static  some volatility is required so that the design can be maintained  CCP: some packages are sensitive to certain types of changes  A volatile package should not be depended on by a package that is difficult to change

 a package designed to be easy to change can (accidentally) become hard to change by someone else hanging a dependency on it!

Stable and Instable Packages Y X  ‘Stable’ = not easy to change  how much effort is needed to change a package: size, complexity, clarity, incoming dependencies  If other packages depend on a package, it is hard to change (i.e. stable)

Stability Metrics  Afferent couplings C  Instability I a  the number of classes  I = C / (C + C ) e a e outside this package  I = 0: maximally that depend on classes stable package within this package

 I = 1: maximally  Efferent couplings C instable package e  the number of classes  Dependencies inside this package  C++: #include that depend on classes  Java: import, qualified outside this package names

SDP  The I metric of a package should be larger than the I metrics of the packages that depends on Instable Instable Instable I = 1 I = 1 I = 1 Stable I = 0 Flexible I > 0

Fixing the Stability Violation Using DIP Stable Flexible U C Stable UInterface Flexible «interface» U C IU

SAP: The Stable-Abstractions Principle A package should be as abstract as it is stable.

 A stable package should be abstract so that stability does not prevent it from being extended  An instable package should be concrete since the instability allows the concrete code to be changed easily

 SDP + SAP = DIP for packages  dependencies run in the direction of abstractions  Since packages have varying degrees of abstractness, we need a metric to measure the abstractness of a package

Measuring Abstractness  The number of classes in the package N c  The number of abstract classes in the package N a abstract class = at least one pure interface and cannot be instantiated  Abstractness A

A = N / N a c A = 0: no abstract classes A = 1: only abstract classes

The Abstractness–Instability Graph Stable/Instable/Abstract/Concrete (0,1) (1,1) Full abstract No dependents A OO-DB (0,0) interface Rigid, no extension, I (1,0) Hard to change

Recap: Package Cohesion and Coupling  REP, CRP, and CCP: cohesion within a package  ‘bottom–up’ view of partitioning  classes in a packages must have a good reason to be there  classes belong together according to some criteria

 political factors  dependencies between the packages  package responsibilities  ADP, SDP, and SAP: coupling between packages  dependencies accross package boundaries  relationships between packages

 technical  political  volatile

F ACTORY  DIP: prefer dependencies on abstract classes avoid dependencies on concrete (and volatile!) classes any line of code that uses the new keyword violates DIP: Circle c = new Circle(origin, 1); the more likely a concrete class is to change, the more likely depending on it will lead to trouble

 How to create instances of concrete objects while depending only on abstract interfaces → F ACTORY

Example: Creating Shapes Violates DIP «creates» Application «interface» Shape Square Circle

Example: Shapes Using F ACTORY Application «interface» ShapeFactory «interface» +makeSquare() Shape +makeCircle() ShapeFactory Square Circle Implementation «creates»

Example: Removing the Dependency Cycle public interface ShapeFactory { | public Shape | make(Class<? extends |     | Shape> t); |     |     | | ------------ | -------------------- | --- | ---------- | --- | --- |

} public class ShapeFactoryImplementation |              |                                   | implements |     | ShapeFactory | {   | | ------------ | --------------------------------- | ---------- | --- | ------------ | --- |

| public Shape | make(Class<? extends Shape> t) {  |            |     |              |     | if (t == Circle.class) return new Circle(); else if (t == Square.class) return new Square(); throw new Error(); }   }

ShapeFactory sf = new ShapeFactoryImplementation(); Shape s1 = sf.make(Circle.class); Shape s2 = sf.make(Square.class);

Benefits of F ACTORY  Implementations can be substituted easily  Allows testing by spoofing the actual implementation Application ShapeFactory «creates» «interface» Implementation 1 Shape «interface»

ShapeFactory «creates» ShapeFactory Implementation 2 Square ShapeFactory Implementation 3 Circle «creates»

F – the Flip Side ACTORY  Factory is a powerful abstraction strictly thinking DIP entails that you should use factories for every volatile class  Do not start out using factories can cause unnecessary complexity

add them when the need becomes great enough

Conclusion  Package Design Cohesion (Reuse–Release Equivalence Principle, Common-Reuse Principle, Common-Closure Principle) Coupling (Acyclic-Dependencies Principle, Stable-Dependencies Principle, Stable-Abstractions Principle)

##  Factory Pattern

REAL Conclusion

Design Patterns (revisited) Abstract Server Proxy Memento Builder Adapter Stairway to Heaven Iterator Bridge Extension Object Command Composite Active Object Decorator Acyclic Visitor Flyweight Visitor

Interpreter Chain of Responsibility Strategy Mediator Observer State Template Method Prototype Factory Method Factory Monostate Facade Singleton Null Object

Design Principles (revisited) 1. Single-Responsibility Principle 2. Open–Closed Principle 3. Liskov Substitution Principle 4. Depency-Inversion Principle 5. Interface-Segregation Principle

How do you think about design patterns?

Principles, Patterns, and Practices Practice Context research, experience needs System concretization Theory Abstraction know-how of practices Forces motivation, synthesis Principles Patterns
