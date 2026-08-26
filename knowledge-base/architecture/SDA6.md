---

title: SDA6

source: SDA6.pdf

converted: 2026-08-25

---

Components The concept of a component is one of the oldest in information technology.

Long before the emergence of software architectures, there were discussions of software components and visions of assembling applications from them, much like how electronic devices are constructed from existing components.

Although this vision has not been fully realized yet, the concept of a component has evolved, and is central part of many technologies and frameworks used today, such as ReactJS. Microservices and serverless architecture are modern software architectural paradigms that also use components as fundamental building blocks. Consequently, the term ”component” has a concrete and precise meaning in many contexts.

Various definitions of a software component have been presented in the literature, and they may not necessarily align with the current understanding of components. In this context, we define a software component as an independent software unit that provides its services through well-defined interfaces. This definition leaves several questions and properties open: • Dependencies. Components rely on specific infrastructure, which can be provided by component technology, software frameworks, or a particular application. They may also depend on services from other components through required interfaces (explained later in this section).

However, components should not be tied to specific other components.

All dependencies must be accessible to the component’s users.

• Deployment. Components can be deployed as standalone units, meeting their environmental requirements. Depending on the situation and technology, deployment can involve source code or compiled binary forms. In the former, deployment occurs at compile time, while in the latter, it happens during linking, application initialization, or actual usage. Later deployment provides more information for selecting the most suitable component.

• Size. There are no strict size limitations for components in componentbasedsoftwaredevelopment. Componentscanrangefromsmall, simple units to larger, more complex ones. As a practical guideline, components should be manageable by a single developer.

• Standardization. The background behind the component idea is the vision of component markets, where various manufacturers offer their

products, and application developers can competitively choose component suppliers. However, such markets require the standardization of interfaces.

Components as software units Acomponentservesasafundamentalunitofarchitecture, addressingvarious aspects like functionality, reusability, product configuration, introduction, adaptability, external development, and task division.

Components encapsulate specific functionality within a software system.

They represent a self-contained unit of code responsible for carrying out a particular task or operation. This division of functionality into components promotes modular design and simplifies the development process. Components are also designed to be reusable. When a developer has developed a component, they can use it in different parts of your application or even in other projects. Reusability saves development time and effort and helps maintain consistency in your software.

Components can be configured and assembled to create different product variations. This is especially valuable in scenarios where a software system must cater to various customer requirements or use cases. By selecting and configuring the appropriate components, you can tailor the product to meet specific needs.

A component is also a unit of introduction. When developing new features or modules, components can be introduced incrementally. This means you can add new components to your system without disrupting existing functionality. This incremental approach simplifies testing, debugging, and maintenance. Components offer adaptability by allowing you to replace or upgrade specific pieces of functionality without affecting the entire system.

If a component no longer meets your needs or becomes outdated, you can swap it out for a more suitable one.

A component is also a unit of external development. Components can be developed independently by different teams or organizations. This is beneficial in large-scale software projects, where multiple parties might be responsible for different components. Each team can focus on their assigned component’sdevelopmentwithoutworryingabouttheentiresystem. Finally, components serve as key units for task division within the organization, each assigned to specific individuals with their own development schedules. This

organizational structure, shaped by component development, begins to mirror the software system’s architecture, following Conway’s Law.

Interfaces One of the most important principles in software engineering is to separate what you want to achieve from how it happens. In the case of components, this means that the implementation of a service should be separated from the service as an abstraction. Service users should not depend on a specific service provider or component but only on the service itself as an abstract concept. This abstract concept is presented as an interface that one or more concrete components implement.

An interface defines the service, which is essentially a set of operations, provided by a component. It acts as a shared boundary where components exchange information, outlining the interaction in both directions along the component’s boundary. It is essential that the implementation of the component is isolated from the interface. The goal is to preserve the integrity of the interface, even when the internal implementation of a component undergoes changes.

In its simplest form, an interface specifies how a service is to be used, including the service’s name, parameters and their types, and the possible return type. This collection of information is referred to as the signature. In a broader sense, an interface should provide all essential information about the service that a service user needs to know. This includes not only the signature but also the service’s definition, its qualitative characteristics (such as its use of time and space), potential side effects, exceptions that may occur during service execution, and dependencies on global resources such as global variables or files.

Interfaces are a crucial part of software architecture. They dictate how components communicate with each other, shaping the fundamental aspects of the architecture. Many design patterns, as we have seen, are based on the use of interfaces. The same goes for architectural styles that will be covered later. Careful interface design is a prerequisite not only for rationalizing development work but also for important software quality attributes such as testability, maintainability, and flexibility. Interface design typically begins as soon as the most critical architectural decisions (such as determining the architectural style) are made.

| Provided | and | Required |     | Interfaces | | -------- | --- | -------- | --- | ---------- | Components and interfaces can have two different relationships with each other: a component can either provide (implement) or require the services defined by an interface. Similarly, a specific interface can be considered provided (provided) or required (required) for a component. The same interface can thus be provided from the perspective of one component and required

| from the | perspective | of another. |     |     | | -------- | ----------- | ----------- | --- | --- | UML (version 2.0) introduced a separate notation for provided and required interfaces. For example, in Figure 1, the component Car (note the component icon in the upper right corner of the class symbol) requires the

PowerSource interface – a car needs a power source. On the other hand, the component Engine provides (implements) this interface. Thus, the two | components | can be | connected   | through | the interface.           |

| ---------- | ------ | ----------- | ------- | ------------------------ | |            | Figure | 1: Provided |         | and required interfaces. | To describe an interface’s behavior, pre-conditions (initial requirements) and post-conditions (expected results) are often used. These form a kind of contract between service users and providers. Pre-conditions define what users must ensure before using a service, while post-conditions outline what

| providers | must deliver | after | the service | runs. | | --------- | ------------ | ----- | ----------- | ----- | This contract-based design, known as design-by-contract, improves software reliability and predictability. Pre-conditions and post-conditions can be communicated informally through descriptions or, more rigorously, using logical expressions in some programming languages like Eiffel. When programming languages lack native support for these constructs, developers can

manually insert checks at the service’s start and end. These checks help ensure the service adheres to the agreed-upon contract.

Tailoring Components The idea of a reusable component implies that the component can be used in different contexts, each of which may have slightly different expectations for the component. If a component always provides its service in exactly the same form, its reusability can become quite limited. Successful reusability requires that the component can be tailored to the specific needs of the environment. Here we will discuss three different ways to tailor components: changing the initial state, implementing required interfaces, and subclassing.

Changing the initial state Components typically have an initial state when they are instantiated. One can customize this initial state to match the specific needs of an application.

When a client component uses another component as a service, it can specify the initial state of the service component, as shown in Figure 2. This means that the client component can determine what values, settings, or properties the service component starts with when it is first used. This customization allows for greater control and adaptability in how components behave within an application.

Implementing required interfaces Thebehaviorofacomponentcanbemoresignificantlycustomizedbyproviding different implementations for the interfaces required by the component.

In this case, the code that executes the service changes because the service implementationleveragesthecodeofanothercomponent, andthelattercomponent is replaced with a different one. Since the component implementing the required interface can be changed at any time during runtime, the behavior of the component can be varied within the same component instance.

In an extreme case, a component’s services can be implemented in such a way that the actual service execution is delegated to another component. In this scenario, the provided and required interface of the original component are the same, and the original component acts as an intermediary between

Figure 2: Tailoring a component by changing the initial state.

Figure 3: An application-specific component implementing the required interface.

the service requester and provider. This approach may be necessary if there is a need for a runtime representative of the interface to store information about interface usage, for example, the Proxy design pattern.

As an example, let us consider Java’s Button component. When the button is clicked, an application-specific action is activated. For this purpose, the component has an operation that allows registering an applicationspecific component to listen for the click event. This component must implement the ActionListener interface, which includes an operation that triggers the application-specific action. When the button is clicked, the

Button component requests the registered application-specific component to

perform this operation. By modifying or adding listener components to the Button component, the behavior of the Button component’s response to a click event can be altered as desired. In Figure 3, the customization of the Button component is demonstrated by providing an application-specific component AppLogic implementing the required ActionListener interface.

The AppLogic component can also be replaced by some other functionality (XLogic) if necessary.

Subclassing Customization based on required interfaces changes the code invoked by the component but not the component’s own code. Sometimes, the desired variation cannot be naturally expressed through different implementations of the required interface, and the component’s own code needs to be altered. If the component is implemented as a class, regular inheritance can be used for this purpose. In this case, a new class inherits from the component, redefining some of its operations. This results in a completely new component that is in an inheritance relationship with the original component. The new component has the same provided interfaces as the original, but some of its services have an entirely new implementation.

As an example of customization achieved through inheritance, let us consider the button component again. Suppose a company wants all its products to consistently display button labels in uppercase letters. For this purpose, thecompanycreatesitsownbuttoncomponent, whichinheritsfromthestandard component and modifies it so that the button text is always converted to uppercase letters. When the company instructs the use of this specialized button instead of the standard Button component, all applications in the company adhere to the desired practice, regardless of how the programmer provides the name.

However, the inheritance mechanism comes with its own set of challenges.

Let us examine an example of the problems brought by inheritance, specifically the fragile base class problem. Suppose a library component, List, implementstheContainerinterface, whichincludesoperationsforaddinganelement (addElement) and another container (addContainer) to the list. The addContainer operation is simply implemented by calling the addElement operation for each element provided as a parameter.

Now, imagine an application developer needs a container that can also keep track of the number of elements in the container. Since the original con-

Figure 4: An example of the fragile base class problem.

tainer implementation and its associated interface do not support this functionality (which is somewhat unusual, but let us assume so for this example), the developer decides to extend the library component using inheritance. At the same time, the developer defines a new interface, CountedContainer, which extends the Container interface with a new operation for querying the number of elements.

A new component, CountedList, implements the CountedContainer interface. It introduces an attribute for storing the count and redefines the addElement operation so that it increments the count in addition to the previous functionality. Since the addContainer operation was initially implemented through the addElement operation, it also correctly updates the count. Everything works fine.

However,thelibrarymaintainerrealizesthattheaddContaineroperation in the original List component could be implemented much more efficiently by directly leveraging the data structure of the container, a list, without relying on the addElement operation defined in the class interface. The library maintainer assumes the change is safe and will not affect existing library users. When the application developer, who extended the List component with CountedList, transitions to use the improved library version, they no-

tice that their application no longer functions correctly. The count attribute does not update as expected. A closer inspection reveals that the problem lies with the addContainer operation. This operation no longer calls the addElement operation, causing the desired update not to occur. The situation is depicted in Figure 4.

The problem in this example is that the library component is designed in a way that makes it fragile in situations where the component is inherited. The implementations of operations are interdependent, so separate re-implementations can easily lead to error conditions. In summary, leveraging inheritance provides a powerful tool for component customization but can also lead to uncontrolled dependencies between components.
