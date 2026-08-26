---

title: SDA_DP_set1

source: SDA_DP_set1.pdf

converted: 2026-08-25

---

Design Patterns: Set 1 |  C    | and A |       | O     | | ------ | ----- | ----- | ----- | | OMMAND |       | CTIVE | BJECT |  T and S EMPLATE METHOD TRATEGY |  F ACADE | and M | EDIATOR |     | | --------- | ----- | ------- | --- |

 S and M INGLETON ONOSTATE |  N O |     |     |     | | ----- | --- | --- | --- | ULL BJECT

COMMAND (1)  Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

 command, receiver, invoker and client

C OMMAND (2) «interface» Sensor Command +do() | RelayOn |          | MotorOn |          | ClutchOn |           | | ------- | -------- | ------- | -------- | -------- | --------- | | Command |          | Command |          | Command  |           |

|         | RelayOff |         | MotorOff |          | ClutchOff | |         | Command  |         | Command  |          | Command   |

C (3) OMMAND  A function object; a method wrapped in an object  The method can be passed «interface» to other methods or Command objects as a parameter +do()  Decouples the object that invokes the operation from +undo() the one performing it

 physical and temporal decoupling  Cf. java.lang.Runnable

ACTIVE OBJECT  Decouples method execution from method invocation that reside in their own thread of control  The goal is to introduce concurrency, by using asynchronous method invocation and a scheduler for handling requests

| A CTIVE          | O BJECT |     | : Example |     | | ---------------- | ------- | --- | --------- | --- | | public interface | Command | {   |           |     | public void execute(); } | public class ActiveObjectEngine |                    | {              |      |                        |

| ------------------------------- | ------------------ | -------------- | ---- | ---------------------- | | private List<Command>           |                    | commands = new |      | LinkedList<Command>(); |

| public void                     | addCommand(Command |                | c) { |                        | commands.add(c); } | public void | run() { |     |     |     | | ----------- | ------- | --- | --- | --- | while (!commands.isEmpty()) {

Command c = commands.getFirst(); commands.remove(c); c.execute(); }   }   }

TEMPLATE METHOD  Defines the program skeleton of an algorithm in a method  Let subclasses redefine certain steps of an algorithm without changing the algorithm's structure.

 NOT related to C++ templates

STRATEGY  Define a family of algorithms  Encapsulate each algorithm  Make algorithms interchangeable  Let the algorithm vary independently from clients that use it.

T and EMPLATE METHOD S TRATEGY Application Application «interface» +run() Runner Application #init() #idle() +init() +run() #cleanup() +idle() +cleanup() Implementation #init() Strategy1 Strategy2 Strategy3

#idle() #cleanup()

| T EMPLATE METHOD | and S | TRATEGY | | ---------------- | ----- | ------- | (cont’d) |  Defines the skeleton of an  |  Defines a family of  |     | | ----------------------------- | ---------------------- | --- |

| algorithm                     | algorithms             |     | |  some steps are deferred     |  encapsulated,        |     | to subclasses interchangeable |  subclasses redefine the  |  algorithm can vary  |     |

| -------------------------- | --------------------- | --- | steps without changing  independently from the overall structure clients that use it |  Used prominently in  |  Identify the protocol that  |     |

| ---------------------- | ----------------------------- | --- | | frameworks             | provides the level of         |     | abstraction, control, and  Cf. java.applet.Applet, interchangeability for the javax.swing.JApplet

|     | client → | abstract base  | | --- | -------- | -------------- | class  All conditional code → concrete derived classes

F ACADE Client Facade +operation1() +operation2() … Database Driver Connection Statement Manager Prepared SQL ResultSet Statement Exception

F (cont’d) ACADE  A unified interface to a set of interfaces in a subsystem encapsulates a complex subsystem within a single interface object makes the subsystem easier to use  Decouples the subsystem from its clients

if it is the only access point, it limits the features and flexibility  Imposes a policy ‘from above’ everyone uses the facade instead the subsystem visible and constraining

M EDIATOR  Imposes a policy ‘from below’  hidden and unconstraining JList JTextField  Promotes loose coupling  objects do not have to refer to one another  simplifies communication  Problem: monolithism

 Example: QuickEntryMediator  binds text-entry field to a «anonymous» list QuickEntry Document  when text is entered, the Mediator Listener first element matching in the list is highlighted

SINGLETON  Ensure a class has only one instance, and provide a global point of access to it  Useful when exactly one object is needed to coordinate actions across the system  Preferred to global variables

S : Example INGLETON public class Singleton { private static Singleton theInstance = null; private Singleton() { /* nothing */ } public static Singleton create() { if (theInstance == null) theInstance = new Singleton(); return theInstance; } }

SINGLETON: Pros/Cons  Cross platform, applicable to any class, can be created through derivation, lazy evaluation  Destruction is undefined, not inherited, efficiency, nontransparent  Be careful when using in multithreaded environment (mutex/semaphore/lock…)

MONOSTATE  Another way to achieve singularity  All data members are static  All instances use the same (static) data  Multithread safe

M : Example ONOSTATE public class Monostate<T> { private static T itsValue = null; public Monostate() { } /* nothing */ public void set(T value) { itsValue = value; } public T get() { return itsValue; } }

MONOSTATE: Pros/Cons  Transparency, derivability, polymorphism, well-defined creation and destruction  No conversion, efficiency, presence, platform local

Comparison  S INGLETON  applicable to any class  lazy evaluation: if not used, not created  not inherited: a derived class is not singleton  can be created through derivation  non-transparent: the user knows…

 cf. java.lang.Integer.MAX_VALUE, java.util.Collections.EMPTY_SET  M ONOSTATE  inherited: a derived class is monostate  polymorphism: methods can be overridden  normal class cannot be converted through derivation

 transparent: the user does not need to know…

NULL OBJECT (1) Employee e = DB.getEmployee(”Bob”); If (e != null && e.isTimeToPay(today)) e.pay()

NULL OBJECT (2)  Avoid null references by providing a default object  A Null Object is an object with defined neutral ("null") behavior  In Java/C#, references may be null.

They need to be checked to ensure they are not null before invoking any methods.

N O ULL BJECT (3) «interface» Application Employee «creates» Employee NullEmployee Implementation «creates»

| N                | ULL                 | O BJECT |                  | : Example |           |     | | ---------------- | ------------------- | ------- | ---------------- | --------- | --------- | --- |

| public interface |                     |         | Employee         | {         |           |     | |                  | public boolean      |         | isTimeToPay(Date |           | payDate); |     |

|                  | public void         |         | pay();           |           |           |     | |                  | public static final |         |                  | Employee  | NULL =    |     | new Employee() {

|     |     | public boolean |     | isTimeToPay(Date |     | payDate) { | | --- | --- | -------------- | --- | ---------------- | --- | ---------- | return false; } |     |     | public void | pay() { /* nothing */ |     |     | }   |

| --- | --- | ----------- | --------------------- | --- | --- | --- | }; }
