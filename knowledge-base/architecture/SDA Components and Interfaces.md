---

title: SDA Components and Interfaces

source: SDA Components and Interfaces.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Components and interfaces Sampsa Rauti and Tampere University of Technology Outline Idea of components • • What is a software component?

• Components as software units • • Tailoring components • Conclusions Interfaces Rationalising software engineering by component-based design • Building products out of components • Products are more reliable

• Products are easier to make • Makers are easier to educate • Component markets and competition decreases prices • Applied in almost all areas of technology What is a software component?

• Component: an independent software unit giving services • through a well-defined interface “A software component is a unit of composition with contractually specified interfaces and explicit context dependencies only. A software component can be deployed independently and is subject to composition by third parties.” (C. Szyperski)

Properties of components • Level of independency • Ways to introduce • Size • Standardization • Technology-specific properties Components as software units • As a basic unit of architecture, a component is a unit of: • Functionality

• Reuse • Product configuration • Introduction • Adaptability • External development • Task division Interface • An interface defines the service (set of operations) provided by the component • A shared boundary where components exchange information

• Defines the interaction and to both directions on the boundary • of the component Implementation of the component is separated from the interface • The aim is to keep the interface intact even if the internal implementation of a component changes

Provided and required interfaces • Component may have two different relationships with an interface: • Interface provided by the component; the component provides the services of the interface • Interface required by the component; the component requires services of the interface

Provided and required interfaces in UML 2.x Design by contract Tailoring components • Changing the initial state of a component • Providing or changing the implementation of required interfaces • Subclassing

Changing the initial value Changing the initial value Providing or chanaging the implementation of required interfaces (dependency injection) Subclassing Fragile base class problem Fragile base class problem, example

Fragile base class problem, example Problems • Fragile base class problem: inheriting a component may be risky • Licensing problems (open source vs commercial) • Changing an interface may break components that use it

Conclusions • Components are basic units of architecture and they are • connected to each other by provided and required interfaces Interfaces should define not only the operations and parameters but also the agreement on the usage of the interface (pre- and postconditions)

• A component can be tailored by changing its initial state, changing the components connected to its required interfaces or by inheriting a specialized component
