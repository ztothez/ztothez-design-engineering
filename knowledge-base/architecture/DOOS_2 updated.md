---

title: DOOS_2 updated

source: DOOS_2 updated.pdf

converted: 2026-08-25

---

DOOS #3: Design Smells Tuomas Mäkilä, Johannes Holvitie Slides: Thomas Canhao Xu Design Smells l A design smell is a sign that the design process is out of control l A serious case can result in missed deadlines and increasing costs l This can be avoided by

¡ incremental design ¡ constant refactoring at many levels What Goes Wrong with Software?

l You start with a clear picture in your mind l Then something goes wrong ¡ changes and additions are harder and harder to make ¡ you are forced to let go of the original design ideas ¡ eventually even the simplest changes terrify you because of rippling unexpected effects, and you must redesign the whole software.

l You started with good intentions, so what went wrong?

Design Smells a.k.a Seven Deadly Sins a.k.a. Symptoms of Poor Design 1.  Rigidity 2.  Fragility 3.  Immobility 4.  Viscosity 5.  Needless complexity 6.  Needless repetition 7.  Opacity Rigidity l The design is hard to change

¡ changes propagate via dependencies to other modules ¡ no continuity in the code l Management reluctance to change anything becomes the policy l Telltale sign: ‘Huh, it was a lot more complicated than I thought.’

Rigidity l How about your program?

l Is it hard to change? (or partially) l Global/public variables?

l Strange naming of functions/classes/ variables?

l Dependencies among functions/ classes?

l What else?

Fragility l The design is easy to break ¡ changes cause cascading effects to many places ¡ the code breaks in unexpected places that have no conceptual relationship with the changed area ¡ fixing the problems causes new problems l Telltale signs

¡ some modules are constantly on the bug list ¡ time is used finding bugs, not fixing them ¡ programmers are reluctant to change anything in the code Fragility l How about your program?

l Is it easy to break? (or partially) l Changing a function/class causes cascading effects?

l What else?

Immobility l The design is hard to reuse ¡ the code is so tangled that it is impossible to reuse anything l Telltale sign: a module could be reused but the effort and risk of separating it from the original environment is too high

Immobility l How about your program?

l Is it easy to reuse? (or partially) l The classes are reuseable? functions reuseable? templates reuseable?

l Can be reused in which scenario?

l What else?

Viscosity l  Viscosity of the software ¡ changes or additions are easier to implement by doing the wrong thing l  Viscosity of the environment ¡ the development environment is slow and inefficient ¡ high compile times, long feedback time in testing, laborious integration in a multi-team project l  Telltale signs

¡ when a change is needed, you are tempted to hack rather than to preserve the original design ¡ you are reluctant to execute a fast feedback loop and instead tend to code larger pieces Viscosity l How about your program?

l Is it "glued"? (or partially) l Can you remove/change any part without breaking the whole system?

l What else?

Needless Complexity l Design contains elements that are not currently useful ¡ too much anticipation of future needs ¡ developers try to protect themselves against probable future changes ¡ agile principles state that you should never anticipate future needs l Extra complexity is needed only when designing an application framework or customizable component l Telltale sign: investing in uncertainty

Needless Complexity l How about your program?

l Not likely too complex l 300-line "Hello World!"?

http://www.cplusplus.com/forum/ lounge/79437/ Needless Repetition l The same code appears over and over again, in slightly different forms ¡ developers are missing an abstraction ¡ bugs found in a repeating unit have to be fixed in every repetition l Telltale sign: overuse of copy-andpaste

Needless Repetition l How about your program?

l Very likely many needless repetition l Repeating functions, variables, classes...

l Copy-paste functions/loops and change few lines for a new function/ loop Opacity l The tendency of a module to become more difficult to understand ¡ every module gets more opaque over time ¡ a constant effort is needed to keep the code readable l easy to understand l communicates its design l Telltale sign: you are reluctant to fix somebody else’s code – or even your own!

E E  E E E E  E E E  E E E  E Opacity l How about your program?

l Very likely to have l Bad naming/comments l Bad structure l Other people can read it?

l You can read it? (or after xx months) http://www.ioccc.org/ Design Smells a.k.a Seven Deadly Sins a.k.a. Symptoms of Poor Design 1.  Rigidity 2.  Fragility 3.  Immobility 4.  Viscosity 5.  Needless complexity

6.  Needless repetition 7.  Opacity DOOS #4: Design Principles Tuomas Mäkilä, Johannes Holvitie Slides: Thomas Canhao Xu How to Avoid the Design Smells l There are five central design priciples that guide towards good design and good coding practices l If the right design principles are well understood, they will lead the design in the right direction without the need for extensive planning

The Five Principles 1.  Single-Responsibility Principle 2.  Open–Closed Principle 3.  Liskov Substitution Principle 4.  Depency-Inversion Principle 5.  Interface-Segregation Principle SRP: The Single-Responsibility

Principle A class should have only one reason to change.

l Cohesion: how good a reason the elements of a module have to be in the same module l Cohesion and SRP: the forces that cause the module to change Responsibility l  Rationale behind SRP ¡ changes in requirements

→ changes in class responsibilities ¡ a ‘cohesive’ responsibility is a single axis of chance → a class should have only one responsibility ¡ responsibility = a reason to change l  Violation of SRP causes spurious transitive dependencies between modules that are hard to anticipate → fragility l  Separating the responsibilities into interfaces decouples them as far as rest of the application is concerned

SRP Example: Rectangle (1) More than one responsibility Computational Geometry Application Rectangle +draw() +area(): double GUI Graphical Application SRP Example: Rectangle (2) Separated responsibilities

Computational Geometry Application Geometric Rectangle +area(): double Graphical Application Rectangle +draw() GUI SRP Example: Modem 1(2) public interface Modem { public void dial(String pno); public hangup(); public void send(char c); public char receive(); }

SRP Example: Modem 2(2) public interface Connection { public void dial(String pno); public hangup(); } public interface DataChannel { public void send(char c); public char receive(); } OCP: The Open–Closed Principle

Software entities should be open for extension, but closed for modification.

– Bertrand Meyer l  ‘Open for extension’: the behaviour of a module can be extended with new behaviours to satisfy the changing requirements l  ‘Closed for modification’: extending the module must not result in changes to the source or even binary code of the module

OCP (cont’d) l  Reduces rigidity ¡ a change does not cause a cascade of related changes in dependent modules l  Changing the module without changing its source code – a contradiction?!

l  How to avoid dependency on a concrete class?

¡ abstraction ¡ dynamic binding Basic OCP Designs STRATEGY TEMPLATE METHOD Client «interface» Client Interface Server Policy +policyFunction() -serviceFunction() Implementation -serviceFunction() Strategic Closure l  Conforming to the OCP is expensive, since it can incur needless complexity l  All changes cannot be anticipated

¡ apply OCP to the most obvious changes l  Otherwise: ‘Fool me once, shame on you. Fool me twice, shame on me.’ ¡ once a change has occurred, it is more probable that a similar kind of change will occur later

¡ apply OCP when it is needed for the first time l  A good strategy: stimulate early changes ¡ fast iterations ¡ constant feedback OCP: Simple Heuristics l Make all object-data private ¡ changes to public data are always at risk to

‘open’ the module ¡ all clients of a module with public data members are open to one misbehaving module ¡ errors can be difficult to find and fixes may cause errors elsewhere l No global variables ¡ it is impossible to close a module against a global variable

LSP: The Liskov Substitution Principle Subtypes must be substitutable for their base types.

– Barbara Liskov l  Functions that refer to base classes must be able to use objects of both existing and future derived classes without knowing it l  Inheritance must be used in a way that any property proved about supertype objects also holds for the subtype objects

LSP and OCP l  LSP is motived by OCP (at least partly) ¡ abstraction and polymorphism allows us to achieve OCP, but how to use them?

¡ key mechanism in statically typed languages: inheritance l  LSP restricts the use of inheritance in a way that OCP holds l  LSP addresses the questions of ¡ what are the inheritance hierarchies that give designs conforming to OCP

¡ what are the common mistakes we make with inheritance regarding OCP?

l  Violation of LSP is a potential violation of OCP Example: Inheritance Has Its Limits public abstract class Bird { public abstract void fly(); } public class Parrot extends Bird { public void fly()   { /* implementation */ } public void speak() { /* implementation */ }

} public class Penguin extends Bird { public void fly() { throw new UnsupportedOperationException(); } } Example (cont’d) public static void playWith(Bird bird) { bird.fly(); } Parrot myPet; playWith(myPet); // myPet "is-a" bird and can fly()

Penguin myOtherPet; playWith(myOtherPet); // myOtherPet "is-a" bird // and cannot fly()?!

Example (cont’d) l  What went wrong?

¡ we did not model ‘Penguins cannot fly’ ¡ we modelled ‘Penguins may fly, but if they try it is an error’ l  The design fails LSP ¡ a property assumed by the client about the base type does not hold for the subtype l  Subtypes must respect what the client of the base class can reasonably expect about the base class

¡ but how can we anticipate what some client will expect?

Another Example l Mammal->walk()?

l All mammal can walk?

l Any mammal can fly but not walk?

l Any mammal can swim but not walk?

Design by Contract l  A class declares its behaviour ¡ requirements (preconditions) that must be fulfilled ¡ promises (postconditions) that will hold afterwards l  This forms a contract between the class and a client using its services

¡ tells explicitly what the client may expect l  B. Mayer (1988): When redefining a method in a derived (or inherited) class ¡ the precondition can be replaced only by a weaker one ¡ the postcondition can be replaced only by a stronger one l  A derived class should require no more and provide no less than the base class

LSP: Simple Heuristic l  Telltale signs of LSP violation: ¡ degenerate functions in derived classes (i.e. overriding a base-class method with a method that does nothing) ¡ throwing exceptions from derived classes l  Solution 1: inverse the inheritance relation

¡ if the base class has only additional behaviour l  Solution 2: extract common a base class ¡ if both initial and derived classes have different behaviors ¡ penguins → Bird, FlyingBird, Penguin l  Sometimes it is not possible to edit the base class

DIP: The Dependency-Inversion Principle High-level modules should not depend on low-level modules. Both should depend on abstractions.

Abstractions should not depend on details. Details should depend on abstractions.

– Robert Martin DIP (cont’d) l  Modules with detailed implementations are not depended upon, but depend themselves upon abstractions l  High-level modules contain the important business model of the application, the policy

¡ independent of details ¡ should be the focus of reuse ¡ greatest benefits are achievable here l  Results from the rigorous use of LSP and OCP ¡ OCP states the goal ¡ LSP enables it ¡ DIP shows the mechanism to achieve the goal

Example: Naïve Layering Scheme Policy Layer Mechanism Layer Utility Layer Example: Inverted Layers Policy Policy Layer Mechanism Utility «interface» Policy Service Interface Mechanism Layer «interface»

Mechanism Service Interface Utility Layer Design to an Interface l  Rationale ¡  abstract classes/interfaces tend to change less frequently ¡  abstractions are ‘hinge points’ where it is easier to extend/modify

¡  no need to modify classes/interfaces that represent the abstraction l  All relationships should terminate to an abstract class or interface ¡  no variable should refer to a concrete class l  use inheritance to avoid direct bindings to concrete classes

¡  no class should derive from a concrete class l  concrete classes tend to be volatile ¡  no method should override an implemented method of any of its base classes l  Exceptions ¡  some classes are very unlikely to change → a little benefit in inserting an abstraction layer l  you can depend on a concrete class that is not volatile (e.g. String class)

¡  a module that creates objects automatically depends on them ISP: The Interface-Segregation Principle Clients should not be forced to depend upon methods that they do not use.

l Many client-specific interfaces are better than one general purpose interface ¡ no ‘fat’ interfaces ¡ no non-cohesive interfaces l Related to SRP Fat Interfaces l  Fat interface = general purpose interface ≠ client-specific interface

¡ can cause bizarre couplings between its clients ¡ when one client forces a change, all other clients are affected l  Break a fat interface into many separate interfaces ¡ targeted to a single client or a group of clients

¡ clients depend only on the methods they use (and not on other clients’ needs) ¡ impact of changes to one interface are not as big ¡ probability of a change reduces ¡ no interface pollution Example: Door and Timer (1) l Secutiry system, door open/ close public class Door { public void lock() { /* implementation */ } public void unlock() { /* implementation */ } public boolean isOpen() { /* implementation */ }

} Example: Door and Timer (2) l  An implementation of “Door”: “TimedDoor”, sound alarm when the door left open too long public class Timer { public void register(int timeout, TimerClient client) { /* implementation */

}   } public interface TimerClient { public void timeout(); } Example: Timer Client at Top of Hierarchy Timer 0..* «interface» TimerClient +timeout() Needless Complexity/ Redundancy Door TimedDoor Example: Separation Through

Delegation Timer 0..* «interface» TimerClient +timeout() Door DoorTimer Adapter +timeout() TimedDoor +doorTimeout() «creates» «registers» Example: Separation Through Multiple Inheritence Timer 0..* «interface»

TimerClient +timeout() Door TimedDoor +timeout() «registers» Role-Based Interface Design l  Interfaces are designed from the viewpoint of the service user, not the service provider ¡ clients own the interfaces l  Interfaces should represent roles that clients take when using the services of a class or component l  Classes implement many interfaces, interfaces are implemented by many classes

¡ example: flying birds (as well as bats) implement interface FlyingCreature, but penguins do not l  Version control by adding new interfaces for clients requiring new services → less viscosity Five Principles (SOLID)

1.  Single-Responsibility Principle 2.  Open–Closed Principle 3.  Liskov Substitution Principle 4.  Dependency-Inversion Principle 5.  Interface-Segregation Principle
