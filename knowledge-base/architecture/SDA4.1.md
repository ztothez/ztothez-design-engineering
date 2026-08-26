---

title: SDA4.1

source: SDA4.1.pdf

converted: 2026-08-25

---

| Design |     |     | Patterns |     |     |     |     |     |     | | ------ | --- | --- | -------- | --- | --- | --- | --- | --- | --- | In software design, design patterns serve as important building blocks. A design pattern is a general solution to a frequently occurring architecture or design problem in a context. Design patterns represent recurring structures and solutions that have proven effective in addressing common design challenges. They encapsulate valuable design knowledge, which might not always be apparent but should be made explicit for the

| benefit |     | of developers. |     |     |     |     |     |     |     | | ------- | --- | -------------- | --- | --- | --- | --- | --- | --- | --- | These design patterns can be likened to what Christopher Alexander termed ”a quality without name” – a characteristic that may not be quantifiable but is unmistakable when encountered. Much like how inhabitants should actively participate in designing their own buildings alongside professionals, software designers aim to create pattern languages that capture the essenceofuser-centereddesign. Thisapproachenablescollaborationbetween users and professionals, using recognized patterns to shape software solutions

| that | meet | the | needs | and expectations |     | of  | the users. |     |     | | ---- | ---- | --- | ----- | ---------------- | --- | --- | ---------- | --- | --- | High-quality constructs in software design share common characteristics.

These structures are intricately connected to the problems they aim to solve.

When we observe recurring similarities in solution structures, we recognize a pattern. Each pattern defines subproblems that can be addressed by smaller patterns within the broader context. A pattern, essentially, is a rule that articulates the relationship between a context, a problem, and a solution. As

| Alexander |          | put | it        | in The Timeless | Way       | of      | Building  | in 1979:          |        | | --------- | -------- | --- | --------- | --------------- | --------- | ------- | --------- | ----------------- | ------ |

|           | ”Each    |     | pattern   | describes       | a problem |         | which     | occurs over and   | over   | |           | again    | in  | our       | environment,    | and       | then    | describes | the core          | of the |

|           | solution |     | to        | that problem,   | in        | such    | a way     | that you can use  | this   | |           | solution |     | a million | times           | over,     | without | ever      | doing it the same | way    | twice.”

Software Design Patterns are reusable solutions addressing general design issues. They provide solutions within specific software development contexts, essentially forming problem-solution pairs tailored to particular situations.

While the basic steps remain consistent, the application of a pattern may vary in each unique context. These patterns encapsulate valuable experience garnered from software development, encompassing aspects of both static and dynamic structures, as well as collaboration among key participants in

the development process. Their primary objective is to facilitate the reuse of successful software architectures and designs, serving as a valuable resource for software engineers.

Design patterns are not tied to any particular programming language, development environment, or technology stack. They are typically documented in a semi-formal manner, providing a structured but flexible description. These patterns address recurring and commonly encountered problems in software design and development. Design patterns can be applied at various levels of software development, ranging from high-level architectural decisions to detailed design choices. Their applicability often arises within specific contexts that define particular requirements or constraints, guiding developers in making informed design decisions.

The usage of design patterns can be motivated by the following reasons: • Reusing Solutions: Design patterns encourage the reuse of proven solutions, allowing developers to benefit from successful designs created by others and avoid repeating their own mistakes. They serve as architectural building blocks for creating new designs.

• Establishing Common Terminology: Design patterns provide a shared language for communication and collaboration among team members.

They facilitate effective documentation of the system, ensuring clarity and consistency in discussions.

• Providing a Higher-Level Perspective: Design patterns offer a higherlevelviewofboththeproblemandthedesignprocessinobject-oriented programming. They help articulate the design rationale, make hidden design knowledge explicit and accessible, and define higher-level structures not directly supported by many programming languages.

The ”Gang-of-Four” (GoF) Design Patterns, as documented by Gamma et al., encompass a widely recognized and comprehensive collection of 23 design patterns. Most of these patterns will be explored in this course. These patterns,outlinedbytheGoF,arecharacterizedbytheirversatility–theyare not tightly bound to specific problems but serve as general solutions. They operate on a relatively small and low-level scale, emphasizing the critical aspects of flexibility and code reuse, particularly through the decoupling of classes. Figure 1 shows a general template for describing design patterns.

The underlying principles that govern these patterns include programming to interfaces rather than specific implementations, promoting composition as a preferable alternative to heavy reliance on inheritance, and identifying and encapsulating variabilities within the software design. Together, these principles and patterns form a foundational framework for creating

| robust and | adaptable | software      | architectures. |           |          | | ---------- | --------- | ------------- | -------------- | --------- | -------- | |            | Figure    | 1: A template | for describing | a design  | pattern. |

| Benefits   | and       | Drawbacks     |                | of Design | Patterns | Design patterns play a vital role in software development, offering several significant advantages. They serve as a shared language among developers, enhancing communication by providing a common framework to discuss complexdesignconcepts. Additionally, designpatternsserveasvaluabledocumentation for a system’s architecture, enabling developers to gain a deeper

| understanding | of  | the codebase | they work | with. |     | | ------------- | --- | ------------ | --------- | ----- | --- | Oneofthemostsignificantbenefitsofdesignpatternsistheirabilitytofacilitate large-scale software reuse. By encapsulating proven architectural and design approaches, patterns allow developers to apply successful solutions to similar problems, reducing development time and effort. It is important to

notethatdesignpatternsdonotofferready-madesolutionsbutratherinspire developers by presenting well-established design strategies. These strategies can be adapted to specific problems, fostering creativity and promoting best practices in software development.

Design patterns, while invaluable in software development, come with their own set of potential challenges. One such challenge is design fragmentation, where the application of multiple patterns can lead to a proliferation ofclassesandcomplicateddependencies,makingthecodebasehardertomanage. Another concern is the risk of overengineering or overkilling problems by applying patterns unnecessarily. Excessive use of dynamic binding, a consequence of using patterns extensively, can potentially result in performance issues.

Patterns can also introduce a concept known as ”object schizophrenia,” where objects become excessively divided, potentially leading to convoluted designs. Additionally, selecting the wrong design pattern for a particular context can have detrimental effects on the overall system. Integrating patterns into the software development process requires a human-intensive effort. They are not ready-to-use pieces of code but rather guidelines that can be implemented in various ways. It is crucial to understand that patterns are not a universal solution for system improvement and should be applied judiciously.

Despite their advantages, patterns can be deceptively simple. They encapsulate condensed and abstracted experience and wisdom, which may require careful interpretation and adaptation. Lastly, it is important to note that patterns are not immutable rules. Developers have the flexibility to reject or modify them to align with the specific needs of their projects, emphasizing the adaptability and practicality of design patterns in software development.

Command The Command Design Pattern is a behavioral design pattern that encapsulates a request or action as an object, allowing one to parameterize clients withqueues, requests, andoperations. TheCommandpatternaimstodecouple the sender of a request (client) from the object that processes the request (receiver) by encapsulating the request as an object. It turns a request into a stand-alone object, which can be stored, passed around, and executed at a

later time.

The Command pattern has the following main components: • Command: This is the abstract interface that declares a method for executing commands (for instance execute() or do()). Concrete command classes implement this interface, encapsulating specific actions or requests.

• Concrete commands: These are specific command classes that encapsulate a particular action or request and link it to a specific receiver object. They implement the execute() or do() method to invoke the appropriate methods on the receiver object that knows how to carry out the action associated with a command.

• Invoker: The invoker is responsible for invoking the command. It holds and manages a reference to a command object and can trigger the execution of the command at the appropriate time.

In the example depicted in Figure 2, Sensor has has a reference to a Command object. The execution process commences by invoking the do() function. This do() function is implemented by one of several concrete command objects, each of which serves as a specific, concrete instance of the

Command interface.

Figure 2: The Command design pattern.

The Command pattern essentially encapsulates a method within an object,creatingafunctionobject. Thismethodcanthenbepassedasaparameter to other methods or objects. One of its primary benefits is the decoupling it provides between the object invoking the operation and the one executing it, both in terms of physical and temporal decoupling. A notable analogy to this concept can be found in the Java java.lang.Runnable interface.

Active Object The Active Object pattern achieves a separation between method execution and method invocation by placing them in separate threads of control. Its primary objective is to enable concurrency through the utilization of asynchronous method invocation and a scheduler to manage and process requests.

Figure 3: The Active Object design pattern.

The example in Figure 3 demonstrates a simple implementation of the Active Object pattern. The Command interface declares a single method execute(). This interface defines the contract for command objects that encapsulate actions to be executed. ActiveObjectEngine is a class responsible for managing and executing a list of commands. It contains a private

ListnamedcommandstostoreinstancesofobjectsthatimplementtheCommand interface. The addCommand(Command c) method makes it possible to

add a command to the list of commands. The run() method processes the | commands | in a loop. |     |     |     |     | | -------- | ---------- | --- | --- | --- | --- | In essence, the code defines a mechanism for queuing and executing commands in a sequential manner. It decouples the execution of commands from their invocation, allowing one to add various types of commands to the ActiveObjectEngine and have them executed asynchronously or at the

| appropriate | time.  |     |          |     |     | | ----------- | ------ | --- | -------- | --- | --- | | Template    | Method | and | Strategy |     |     | The Template Method pattern outlines the structure of an algorithm within a method (in an abstract class), allowing subclasses to redefine specific steps of the algorithm while preserving its overall structure. It is important to note that this pattern is unrelated to C++ templates, despite the similar name. The Template Method pattern defines the fundamental skeleton of an algorithm. It delegates certain steps to subclasses, which can then redefine

| these steps | without altering | the overall | algorithm    | structure. |           | | ----------- | ---------------- | ----------- | ------------ | ---------- | --------- | | Figure      | 4: The Template  | Method      | and Strategy | design     | patterns. |

The Strategy pattern is a design pattern that defines a family of algorithms, each encapsulated in its own class. By doing so, it enables the interchangeability of these algorithms without requiring clients to understand

their specific details. This approach allows for independent variation of algorithms and their usage by clients, promoting flexibility and maintainability in software design. An abstract base class serves as the protocol, providing the necessary level of abstraction, control, and interchangeability for clients. Meanwhile, concrete derived classes house the specific implementation details, including any conditional code, enabling different variations of the algorithm to be seamlessly employed.

The example in Figure 4 illustrates how these two design patterns can be used to customize algorithms. While Strategy (on the right side) focuses on defining a family of interchangeable algorithms, allowing clients to choose and switch between them, Template Method (on the left side) defines the overall structure of an algorithm, with certain steps left to be implemented by subclasses. Both patterns promote encapsulation by isolating specific algorithmic behaviors in separate classes or methods. They help decouple theclientcodefromthedetailsofalgorithmimplementation, promotingloose coupling and easier maintenance.

Figure 5: The Facade design pattern.

Facade The Facade pattern provides a cohesive interface to a set of interfaces within a complex subsystem. By encapsulating the intricacies of the subsystem

in a single interface object, the facade simplifies its usage. This pattern also decouples the subsystem from its clients, although it can limit features and flexibility if it is the sole access point. Furthermore, it enforces a policy

”fromabove”byencouragingeveryonetointeractwiththefacaderatherthan directly with the subsystem, which can be both visible and constraining. In Figure 5, the Facade pattern is used to decouple a complex database system from its clients.

Mediator The Mediator pattern promotes loose coupling among objects within a system. By using a mediator, objects do not need to directly refer to one another, which simplifies communication and reduces dependencies. Because objects are not directly coupled, a developer can change or extend the system by adding new objects or modifying existing ones without affecting the rest of the system significantly. The mediator handles the complexities of routing and managing these interactions. However, one challenge associated with the Mediator pattern is the potential for creating a monolithic mediator that takes on too many responsibilities, which can be detrimental to system maintainability.

Figure 6: The Mediator design pattern.

In the example shown in Figure 6, the QuickEntryMediator class facilitates interaction between a JTextField and a JList, binding the text-entry fieldtoathelist. Whentextisentered, thefirstelementwithamatchingpre-

fix in the list is highlighted. One of the key benefits of using a mediator like QuickEntryMediator in this scenario is that it decouples the JTextField and JList classes from one another and handles the communication and coordination between them. The user of QuickEntryMediator also does not have to know about JTextField and JList.

Singleton and Monostate The Singleton pattern ensures that a class has only one instance and offers a global point of access to that instance. It is valuable when precisely one objectisrequiredtocoordinateactionsthroughoutthesystem. Itisapreferable alternativetousingglobalvariables, promotingbettercontrolandencapsulation of shared resources. Figure 7 shows the Singleton pattern implemented in Java. The constructor of the Singleton class is intentionally kept empty, and the responsibility for creating a single instance lies with the create() method, which contains the necessary logic to enforce the Singleton pattern and ensure that only one instance is ever created.

Figure 7: The Singleton design pattern.

The Monostate pattern offers an alternative method to achieve singularity. In this pattern, all data members within the class are declared as static.

Consequently, all instances of the class share the same static data. This approach inherently ensures multithread safety, as all instances access the

|     | Figure | 8: The Monostate |     | design pattern. | | --- | ------ | ---------------- | --- | --------------- | shared data in a thread-safe manner. Figure 8 demonstrates the Monostate | pattern | in Java. |     |     |     |

| ------- | -------- | --- | --- | --- | The Singleton pattern can be applied to any class and offers lazy evaluation, meaning an instance is created only when required. It does not support inheritance, as a derived class is not a Singleton. However, it can be created through derivation. Singleton may not be entirely transparent to the user, | as they may | need to | be aware of | its implementation. |     |

| ----------- | ------- | ----------- | ------------------- | --- | In contrast, the Monostate pattern supports inheritance, allowing derived classes to also be Monostate. It emphasizes polymorphism, as methods can be overridden in derived classes. Unlike Singleton, a normal class cannot be converted into a Monostate through derivation. Monostate tends to be more transparent to the user, as they do not need to know its internal implementation details.

In summary, Singleton is suited for creating a single instance of a class, while Monostate allows for multiple instances to share the same data and is more amenable to inheritance and polymorphism. The choice between them

| depends | on the specific | design requirements |     | of a project. | | ------- | --------------- | ------------------- | --- | ------------- |

Figure 9: An implementation of Null Object pattern.

Figure 10: The Null Object design pattern.

Null Object Intraditionalprogramming,whendealingwithobjects,itiscommontocheck if an object is null before using it to prevent null reference errors. The Null Object pattern offers a more elegant solution to handling null references.

It aims to avoid null references altogether by providing a default object, often referred to as a Null Object. This Null Object has defined neutral or ”null”behaviorforthemethodsitimplements. Whendealingwithreferences that may be null (e.g., in Java or C#), you can replace null references with instances of the Null Object. This eliminates the need for explicit null checks before invoking methods, as the Null Object’s methods will not have unintended side effects and will gracefully handle the null case. In summary,

the Null Object pattern helps improve code readability and maintainability by replacing null references with default objects that provide predictable and safe behavior, reducing the need for explicit null checks. Figures 9 and

10 show the Null Object pattern and an implementation that demonstrates neutral behavior (doing nothing) for Employee’s pay() method.

Composite The Composite design pattern is a partitioning pattern that involves composing objects into tree structures to represent part-whole hierarchies. This pattern allows clients to interact with both individual objects and compositions of objects in a uniform manner. It is particularly useful when clients need to work with these structures without concerning themselves with the distinction between compositions of objects and individual objects.

Figure 11: The Composite design pattern.

The example shown in Figure 11 demonstrates the use of the Composite pattern. There is a common interface called Shape, which includes a draw() method. Two concrete classes, Circle and Square, implement the

Shape interface to represent individual shapes. Additionally, there is another class called CompositeShape that also implements the Shape interface, and plays the role of a composite. It has the method add(Shape) to include other shapes within it, and the draw() methods which delegates drawing to individual objects. The key aspect of the Composite pattern is

that CompositeShape can contain both individual shapes (like Circle and Square) and other composite shapes, forming nested hierarchies.

The benefit of using the Composite pattern is that it allows you to create complex structures by composing objects into tree-like hierarchies. Clients can interact with individual shapes and composite shapes uniformly through the Shape interface. This simplifies the client code, as it does not need to differentiate between individual shapes and complex compositions, making the system more flexible and maintainable.

Observer The Observer pattern is a behavioral design pattern that establishes a subscription mechanism for informing multiple objects about events occurring in the object they are observing. The Observer pattern involves an object (referred to as the subject) maintaining a list of its dependents (known as observers). It automatically informs these observers about any changes in its state by invoking one of their methods. This pattern is primarily used to implement distributed event handling systems and plays a crucial role in the

Model-View-Controller (MVC) architectural pattern.

Figure 12: Synchronous event handling with Observers.

In a system or application, the Observer pattern can be seen as a way to handle global events to which related modules can react. Importantly, the creator and handler(s) of the event do not need to be aware of each other,

leading to a lack of direct dependencies. Figure 12 illustrates event handling with Observers.

In practice, the Observer pattern involves defining an object that keeps the data model (the subject) and delegates all ”view” functionality to decoupled and distinct observer objects. Observers register with the subject at their creation. When the subject changes, it notifies all registered observers.

Observers can query the subject for the specific data they are responsible for monitoring. Notably, the number and types of observers can be configured dynamically at runtime, making it a flexible and versatile pattern for managing dependencies and handling events in software systems.

The Observer pattern can be implemented using two models: the ”Pull Model” and the ”Push Model,” each offering distinct approaches to how observers receive updates from the subject.

• Pull Model: In the Pull Model, observers take an active role in obtaining updates. They periodically query the subject for changes in its state when they are ready to process updates. This model empowers observers to control the timing of updates and can be advantageous when they have varying requirements for handling changes. Figure 13 illustrates the Pull Model.

• Push Model: InthePushModel, thesubjectactivelypushesupdatesto its registered observers. When a change occurs in the subject’s state, it immediately notifies all observers and transmits the relevant data or information. The Push Model is suitable when observers require immediate notification of changes and simplifies the process of keeping observers synchronized with the subject. Figure 14 illustrates the Push

Model.

The Observer pattern is valuable in several scenarios. It suits situations where an abstraction consists of two aspects, with one depending on the other. It proves useful when a change to one object necessitates changes in others, and the exact number of objects needing changes is uncertain. It allows an object to notify other objects without making assumptions about their identities or existence.

The Observer pattern is highly versatile and widely employed. Once developers grasp its concepts, they will start recognizing opportunities to apply it in various contexts. It offers the ability to register observers with

Figure 13: Observer – Pull model.

Figure 14: Observer – Push model.

different objects, eliminating the need to write explicit calls in those objects for notification. This flexibility contributes to its widespread use in software design.

Abstract Server Consider Figure 15, a design for a simple table lamp with turn-on and turnoff functions. The design has some drawbacks that conflict with important design principles. Specifically, it violates the Dependency-Inversion Principle (DIP)andtheOpen/ClosedPrinciple(OCP).TheviolationofDIPisevident

because the Switch depends directly on the Light, which is a concrete class.

DIPencouragesustopreferdependencies onabstractclasses, providingmore flexibility. The violation of OCP is also a concern. This design forces us to always associate a Light with a Switch, making it challenging to extend the

| Switch | to control | other  | types of   | objects.   |                | | ------ | ---------- | ------ | ---------- | ---------- | -------------- | |        |            |        | Figure 15: | Switch and | Light.         |

|        |            | Figure | 16: A      | bad way to | extend Switch. | One might consider creating a subclass of Switch, like FanSwitch in Figure 16, to control something other than a Light. However, this does not fully address the issue because FanSwitch still inherits the dependency on

Light, which does not adhere to DIP. To resolve these problems, we can apply the simple Abstract Server design pattern, as shown in Figure 17. By introducing an interface between the Switch and the Light, we enable the

Switch to control anything that implements that interface, satisfying both

DIP and OCP principles. Light and Fan are now completely separated from each other, as they should.

Figure 17: Extending Switch with Abstract Server.

A strong argument can be made that interfaces belong to the client, not to the derived classes. The connection between the client and the interface is more robust than the link between the interface and its derived classes. This bondissostrongthatdeployingaSwitchwithoutSwitchableisimpractical, yetdeploying SwitchablewithoutLightremainsavalidandsensible choice.

Adapter In the context of the previously discussed Abstract Server pattern and the related example, there is a potential Single Responsibility Principle (SRP) violation. This arises from the fact that Light and Switchable may not change for the same reasons, introducing a lack of cohesion in their responsibilities.

A solution to this issue is to introduce a class that can be adapted to the interface, addressing the SRP concern. The use of the Adapter design pattern is shown in Figure 18. The Adapter permits the utilization of an existing class’s interface by another interface. This pattern is often employed tofacilitatetheintegrationofexistingclasseswithnewoneswithouttheneed to modify the source code of the existing classes.

Figure 18: A solution with the Adapter design pattern.

However, this solution comes with a drawback – it requires the creation of additional classes and instances, potentially adding complexity to the design.

Invoking the adapter also incurs time and space costs due to delegation.

Consequently, using adapters extensively is not advisable.

In the approach presented in Figure 18, the LightAdapter class is a object-form adapter. Another approach is termed the class-form adapter. In thisvariation,theadapterobjectinheritsfromboththeSwitchableinterface and the Light class. While the class-form adapter is slightly more efficient and easier to use, it introduces higher coupling through inheritance as a trade-off.

Bridge The Bridge design pattern is designed to separate an abstraction from its implementation, allowing them to evolve independently. This decoupling is achieved through the use of encapsulation, aggregation, and, in some cases, inheritance, which helps in organizing responsibilities into distinct classes.

We will illustrate this concept with a practical example: modeling animal characteristics. In this scenario, each animal can possess a varying number of legs (an integer) and exhibit different types of movement, such as flying, walking, or crawling. Animals must provide the number of legs they have and calculate the time needed to move a distance on different terrains.

However, handling these variations can lead to tight coupling and messy

code. Animal types are often derived from a base class, and managing subtypes becomes complex. Furthermore, animals cannot exhibit more than one type of movement, limiting flexibility. This approach also raises questions

| about broader | classifications | like mammals, | reptiles, and | birds. | | ------------- | --------------- | ------------- | ------------- | ------ | Figure 19: Bridging two hierarchies with the Bridge design pattern.

To address these challenges, we encapsulate behavior, such as movement, intoseparateclasses. TheAnimalclassthenincludesanobjectthatembodies the relevant behavior, resulting in cleaner and more flexible code. This is

| demonstrated | in Figure | 19. |     |     | | ------------ | --------- | --- | --- | --- | Proxy The Proxy design pattern serves as a means to navigate a barrier without either of the involved parties being aware of it. It is frequently employed in scenarios involving third-party APIs, such as databases or networks. In theory, a Proxy can be seamlessly inserted between two collaborating objects without their awareness. However, in practice, achieving this seamless

| integration | can be more | complex than  | it appears.     |     | | ----------- | ----------- | ------------- | --------------- | --- | |             | Figure      | 20: The Proxy | design pattern. |     |

In an example demonstrating the Proxy design pattern (Figure 20), we haveascenariowherethereisaninterfacecalledOrder, whichdeclaresallthe methodsthatclientsneedtoinvoke. Aclass,knownasOrderImplementation, takesontheresponsibilityofimplementingthesemethodswithoutanyknowledge of the underlying database. To facilitate the interaction with the database, there is a proxy called OrderDBProxy. The proxy is equipped with knowledge about the database. With this configuration in place, the proxy can efficiently delegate calls to the OrderImplementation class while managing interactions with the database seamlessly, all without the client’s involvement or awareness of these details. Figures 21 and 22 show the rough

| implementations | for        | the example     | scenario. |                 |           | | --------------- | ---------- | --------------- | --------- | --------------- | --------- | |                 | Figure 21: | Implementations |           | of Order and    | OrderImp. |

|                 | Figure     | 22: OrderProxy  |           | implementation. |           |

Stairway to Heaven The Stairway to heaven design pattern is a way to attain dependency inversion, keeping the database details separate from the core business rules of the application. In the example shown in Figure 23, the goal is to represent the database structure as persistent objects. We are working with products and assemblies, each having its implementation. The Assembly class inherits from Product. The PersistentObject class is responsible for handling read and write functions required for any persistent object linked to the database.

Figure 23: Stairway to heaven design pattern.

Here, the ”stairway to heaven” idea entails modeling a product as a persistent object. This means the PersistentProduct inherits both the PersistentObject and the regular Product, which includes the business logic. Similarly, there is a PersistentAssembly class that inherits not only from Assembly but also from PersistentProduct. By using PersistentProduct and PersistentAssembly, we ensure the automatic persistence of objects without direct dependencies on the database itself.

This approach achieves dependency inversion like the Proxy pattern. It also resembles a variation of the class form of the Adapter pattern. It effectively isolates knowledge of the database from the application’s business rules. It is worth noting the approach only practical in languages supporting multiple inheritance.
