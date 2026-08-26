---

title: SDA3

source: SDA3.pdf

converted: 2026-08-25

---

Design Principles To avoid design smells, it is essential to adhere to central design principles thatpromotegooddesignandcodingpractices. Whenthesedesignprinciples are well-understood, they naturally steer the design process in the right direction, often eliminating the need for extensive planning. These principles serve as valuable guidelines for creating robust and maintainable software solutions.

The five design principles discussed in this section, collectively known as SOLID, include: 1. Single-Responsibility Principle 2. Open–Closed Principle 3. Liskov Substitution Principle 4. Depency-Inversion Principle

5. Interface-Segregation Principle The Single-Responsibility Principle The Single-Responsibility Principle (SRP) states that a class should have only one reason to change. In other words, it should have a single, well-defined responsibility or purpose. High cohesion and adherence to SRP are forces that help maintain the stability and clarity of a module’s design.

Cohesion in software design refers to the extent to which elements within a module – such as a class or a component – are closely related and work togethertoperformaspecific, well-definedtaskorresponsibility. Inamodule with high cohesion, its constituent elements share a common purpose, and there is minimal or no unnecessary overlap in functionality. Coupling, other the other hand, refers to the degree of dependency or connection between different parts of a software system. When classes adhere to SRP and have well-defined responsibilities, they tend to have fewer dependencies on other classes.

Responsibility is the fundamental concept that underpins the SRP. The rationale behind SRP lies in the fact that changes in requirements often lead to changes in class responsibilities. A ”cohesive” responsibility represents a

Figure 1: An example of the Single-Responsibility Principle.

single axis of change, suggesting that a class should have only one responsibility. In essence, a responsibility can be thought of as a reason for a class to change. Violation of SRP can result in unexpected transitive dependencies between modules, leading to fragility in the codebase. To mitigate this, separating responsibilities into interfaces can decouple them, making the codebase more robust and maintainable as it isolates changes within individual modules.

In the example shown on the left side of Figure 1, the Rectangle class assumes dual responsibilities: 1) Calculating the area of the Rectangle, and 2) Drawing the rectangle on the GUI. However, this design exhibits low cohesion since geometric calculations and drawing operations do not inherently belong together.

The Rectangle class is employed by two distinct applications. The ComputationalGeometryApp, focused on geometric computations, utilizes the area() function. Rectangle also offers a drawing method, utilizing the

GUI to implement draw(). Unfortunately, ComputationalGeometryApp becomes dependent on GUI, even when its sole requirement pertains to the geometric properties of rectangles.

SRP is clearly violated here, as Rectangle has two separate motivations for change. It enforces a dependency of the ComputationalGeometryApp on the GUI class. If the Rectangle class is changed, corresponding changes in

the ComputationalGeometryApp may be necessary, and vice versa.

As shown on the right side of Figure 1, a solution is to segregate responsibilities. WecreateGeometricRectangle, responsiblesolelyforarea()calculations. ComputationalGeometryApp exclusively uses GeometricRectangle, relying on its geometric features. This separation enhances reusability and ensures that changes in responsibilities affect only the relevant class. Both classes maintain clarity: Rectangle represents a rectangle visually, while

GeometricRectangle embodies the geometric aspects of the shape.

The Open-Closed Principle The Open-Closed Principle (OCP) states that software entities should be open for extension but closed for modification. The ”open for extension” part means that the behavior of a module can be extended with new functionalities to accommodate changing requirements. One can add new features or behaviors to the module without altering its existing code. The

”closed for modification” principle dictates that extending a module should not necessitate changes to its source code or even its binary code. That is, existing code should remain untouched when introducing new features or behaviors.

OCP offers several benefits. It reduces rigidity by ensuring that changes to a module do not set off a cascade of related changes in dependent modules. This might initially challenge the idea of extending a module without altering its source code, but it is possible. The key to achieving this lies in avoiding dependency on a concrete class. This is achieved through the use of abstraction and dynamic binding, allowing for the extension of module behavior without direct modifications to the source code.

Two common fundamental design patterns that support OCP are the Strategy Pattern and the Template Method Pattern, covered later in this course. The Strategy Pattern enforces OCP by enabling the encapsulation of interchangeable behaviors as separate strategies. This simplifies the process of extending and adding new strategies without requiring modifications to existing code. On the other hand, the Template Method Pattern aligns with

OCP by defining the core structure of an algorithm while allowing subclasses to override specific steps. This flexibility enables the extension of algorithm behavior while maintaining the overall structure intact. Both patterns offer a means of abstraction that allows for the extension of new functionalities

without the need to modify the original class structure.

Conforming to OCP is a valuable practice, but it comes with some considerations. It can be expensive, potentially introducing needless complexity to the system. Not all changes can be anticipated, so it is essential to apply OCP to the most obvious and foreseeable changes. As the saying goes, ”Fool me once, shame on you; fool me twice, shame on me.” Once a change has occurred, it is more likely that similar changes will follow in the future.

Therefore, applying OCP when it is needed for the first time can be a wise strategy. One effective approach is to stimulate early changes through fast iterations and constant feedback. This proactive stance can help identify and address OCP requirements in a timely manner, reducing potential complexities down the road.

When applying OCP, developers should consider a couple of straightforward guidelines. First, it is advisable to make all object data private. This means avoiding public data members, as they expose the module to potentialmodificationsfromexternalsources. Whenamoduleincludespublicdata members, it puts all its clients at risk if one module misbehaves. Moreover, errors arising from public data can be challenging to pinpoint, and fixes may inadvertently introduce new issues elsewhere. Second, it is essential to steer clear of global variables. Relying on global variables makes it impossible to completely seal off a module from the influence of these variables, making it harder to adhere to the OCP.

The Liskov Substitution Principle The Liskov Substitution Principle (LSP) emphasizes that subtypes should be substitutable for their base types. In practice, this means that functions designed to work with base classes should seamlessly handle objects of both existing and future derived classes without being aware of the specific subtype in use. Additionally, LSP highlights the importance of inheritance being used in such a way that any property or behavior established for supertype objects should also apply to subtype objects. In essence, it promotes the idea that derived classes should extend, rather than contradict or modify, the behavior of their base classes, ensuring a consistent and compatible hierarchy of classes.

LSPfindsmotivationintheOpen-ClosedPrinciple(OCP),atleastpartly.

Itrecognizesthatabstractionandpolymorphismareessentialtoolsforachiev-

ing OCP, but it also raises questions about how to effectively use them. In statically typed languages, like those utilizing inheritance as a key mechanism, LSP places restrictions on the use of inheritance to ensure the preservation of OCP. It addresses critical questions, such as identifying the inheritance hierarchies that lead to designs aligned with OCP principles and understanding common pitfalls related to inheritance concerning OCP. It is important to note that a violation of LSP has the potential to be a violation of OCP, highlighting the interconnectedness of these principles in the realm of object-oriented design.

In the example presented in Figure 2, we have a hierarchy of bird classes, where Bird is an abstract class with a fly method that must be implemented by its subclasses. The Parrot class extends Bird and provides an implementation for the fly method, as well as an additional speak method. However, the Penguin class also extends Bird but throws an exception in its fly method, indicating that penguins cannot fly.

The issue arises when we attempt to use the playWith function, which takes a Bird as a parameter and calls the fly method on it. When we use it with a Parrot, everything works as expected because parrots can fly. However, when we use it with a Penguin, it throws an exception, which is not in line with what we expect from a bird.

What went wrong here is that the design did not accurately model the fact that penguins cannot fly. Instead, it modeled that penguins may fly, but if they try, it is considered an error. This violates the Liskov Substitution

Principle (LSP) because a property that the client assumed about the base type (Bird) does not hold true for the subtype (Penguin).

The fundamental principle violated here is that subtypes must respect what the client of the base class can reasonably expect about the base class.

Inthiscase,theclientcouldreasonablyexpectthatiftheyhaveaBirdobject, they should be able to call fly on it without encountering exceptions. To address this, it is essential to model the behavior of penguins accurately, considering that they cannot fly, rather than modeling it as an error.

Anticipating all client expectations can be challenging, making it crucial to carefully design and document the behavior of classes and their subtypes.

To this end, Design by Contract is a methodology where a class explicitly declares its expected behavior through a set of requirements known as preconditions and commitments referred to as postconditions. This declaration forms a clear contract between the class and any client that uses its services, providing explicit guidelines on what the client can anticipate.

| Figure | 2: An example | of the Liskov | Substitution | Principle. | | ------ | ------------- | ------------- | ------------ | ---------- |

In the context of Design by Contract, a principle outlined by B. Mayer states that when redefining a method in a derived or inherited class, certain rules apply. The precondition of a method can only be replaced by a weaker precondition, ensuringthatthederivedclassdoesnotimposestricterrequirements on input data. Similarly, the postcondition can only be replaced by a stronger one, ensuring that the derived class guarantees at least the same outcomes as the base class.

In essence, Design by Contract underscores the principle that a derived class should demand no more and guarantee no less than the base class.

This approach promotes robust, predictable, and maintainable software by explicitly defining and enforcing the expected behavior of classes and their interactions. It also strongly supports adherence to the Liskov Substitution

Principle.

When assessing compliance with the Liskov Substitution Principle (LSP), certain heuristics come in handy. Two notable indicators of potential LSP violations include degenerate functions within derived classes, where base-class methods are overridden with implementations that essentially do nothing, and the practice of throwing exceptions from derived classes.

To remedy these violations, two primary solutions can be employed. One approach involves reversing the inheritance relationship. This is a viable option when the base class primarily introduces additional behavior that does not align with the derived classes. Another solution is to extract a common base class. This is advisable when both the original and derived classes exhibit distinct behaviors. For instance, in the case of penguins from the earlier example, one might consider creating classes like Bird, FlyingBird, and Penguin to capture their shared and unique characteristics. It is important to note that in some scenarios, modifying the base class to address

LSP violations may not be feasible or practical. In such cases, alternative strategies may need to be considered.

The Dependency Inversion Principle The Dependency Inversion Principle (DIP) states that ”High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.” The principle emphasizes that modules with detailed implementations should not be dependent on other

modules but should instead depend on abstractions. The developer should hide functionality behind abstractions because doing so makes it easier to modify the code.

In practice, this also means that high-level modules should encapsulate the essential business model and policy of the application. These modules should remain independent of implementation details and should be designed with reusability in mind. The most significant benefits in software design are typically achieved at this level, where the focus is on abstract policies that can be reused across different contexts.

The Dependency Inversion Principle is a result of the rigorous application of both the Liskov Substitution Principle (LSP) and the Open-Closed Principle (OCP). OCP sets the goal of designing open for extension and closed for modification systems, while LSP enables the achievement of this goal by ensuring that derived classes can be substituted for their base classes without issues. DIP, in turn, provides the mechanism to achieve this goal by advocating for the use of abstractions to decouple modules and promote flexibility in software design.

In traditional application architecture (Figure 3), there is a common pattern where higher-level components rely directly on lower-level components to achieve specific tasks. For instance, a Policy Layer might depend on a

Utility Layer to function. This direct dependency can limit the reusability of higher-level components.

The Dependency Inversion Principle (Figure 4) aims to break this tightly coupled structure by introducing an abstract layer. With this abstract layer, both high- and lower-level components reduce their direct dependencies.

However, the term ”inversion” does not imply that lower-level layers now directly depend on higher-level layers. Instead, both layers should depend on abstractions, typically defined as interfaces, which expose the required behavior for higher-level components.

In a direct application of the Dependency Inversion Principle, the abstractions are owned by the upper-level or policy layers. This architectural arrangement groups the higher-level components and the abstractions defining lower-level services together in the same package. Lower-level layers are then constructed through inheritance or implementation of these abstract classes or interfaces.

This inversion of dependencies and ownership promotes the reusability of higher-level layers. Upper layers can potentially utilize different implementations of lower services. In cases where lower-level layer components are

|     | Figure | 3: Traditional    | application | architecture.      | | --- | ------ | ----------------- | ----------- | ------------------ | |     | Figure | 4: The Dependency | Inversion   | Principle applied. | closed or when there is a need to reuse existing services, Adapters (a design pattern covered later in this course) often mediate between the services and

| the abstractions, |                       | ensuring a smooth | integration. |           | | ----------------- | --------------------- | ----------------- | ------------ | --------- | | The               | Interface-Segregation |                   |              | Principle |

The Interface-Segregation Principle (ISP)statesthatclients should not be forced to depend upon methods that they do not use. It emphasizes

the idea that having many client-specific interfaces is more advantageous than having a single, general-purpose interface. This principle discourages the creation of what are often referred to as fat interfaces, which try to encompass numerous functionalities, and it encourages the avoidance of noncohesive interfaces that lack a clear and focused purpose.

In essence, ISP promotes the design of interfaces that are tailored to specific client needs, ensuring that they are neither overloaded with unnecessary functionalities nor lacking a clear and cohesive purpose. This principle is closely related to the Single Responsibility Principle (SRP), as both principles promote the creation of interfaces and classes that have well-defined and focused responsibilities, contributing to more modular and maintainable software design.

Fat interfaces, characterized by their general-purpose nature, are distinct from client-specific interfaces. When a single, general-purpose interface contains numerous functionalities, it can lead to unexpected and undesirable dependencies among its clients. Any change imposed by one client affects all other clients relying on that interface.

To address this issue, it is advisable to break down a fat interface into multiple separate interfaces. These separate interfaces should be tailored to individual clients or groups of clients, ensuring that clients only depend on themethodstheyrequire,withoutbeingaffectedbytheneedsofotherclients.

By doing so, the impact of changes to one interface is minimized, reducing the probability of extensive modifications. Additionally, this approach helps prevent interface pollution, where a single interface accumulates unnecessary methods or responsibilities over time.

As an example, consider a security system with Door objects that can be locked, unlocked, and track their open/closed status (Figure 5). We use an abstract Door class to provide a common interface for clients without tying them to specific implementations. Now, let us focus on a specific implementation, the TimedDoor, which needs to trigger an alarm if left open too long.

To achieve this, the TimedDoor interacts with a Timer object, registering a TimerClient object to be notified when a timeout occurs.

The challenge is to establish communication between the TimerClient class and the TimedDoor class effectively. One solution (Figure 6) is to make Door and, consequently, TimedDoor inherit from TimerClient. While this approach works, it introduces issues. Door now depends on TimerClient, even though not all Door variations require timing functionality. This leads tointerfacepollution, whereDoor’sinterfaceincludesanunnecessarymethod

| Figure | 5: Door,       | Timer and  | TimerClient.      | | ------ | -------------- | ---------- | ----------------- | | Figure | 6: TimerClient | at the top | of the hierarchy. | solely for one subclass.

A cleaner solution is to employ the object form of the Adapter pattern (Figure 7). We create a DoorTimerAdapter that derives from TimerClient and delegates actions to TimedDoor. When TimedDoor needs to register a timeout request with the Timer, it creates a DoorTimerAdapter and regis-

Figure 7: The solution with DoorTimerAdapter which adheres to ISP.

ters it instead. When the Timer triggers a timeout, the DoorTimerAdapter | forwards | the message | to TimedDoor. |     |     | | -------- | ----------- | ------------- | --- | --- | This approach adheres to the Interface Segregation Principle and avoids unnecessary coupling between Door clients and Timer. Even if Timer’s interface changes, Door clients remain unaffected. Additionally, TimedDoor does not need to precisely match TimerClient’s interface; the DoorTimerAdapter

| can handle | the translation, | making | it a versatile | solution. | | ---------- | ---------------- | ------ | -------------- | --------- |
