---

title: Styles1

source: Styles1.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Architectural styles, part 1 Sampsa Rauti and Tampere University of Technology Architectural styles • Partitioning architectural styles • Layer / tier architectures (partition by structure)

• Pipers and filters architecture (partition by functionality) • Service-based architectural styles • Client-server architectures • Peer-to-peer • Message-passing architectures (publish-subscribe) • Special architectures

• MVC architectures • Interpreter architectures What is an architectural style?

• Architectural style = a common model telling how the system is organized on the highest abstraction layer. Defines the general technical nature of the system.

• Architectural styles do not exclude each other!

• Questions leading to a selection of an architectural style: • Does the system consist of components on different conceptual levels?

Is the main purpose of the system process information?

• • Does the system share information or resources with individual applications?

• Does the system consist of a set of components communicating with each other in ways not know in advance? Do the components change often?

Layer architecture • System is organized as layers with increasing abstraction levels Layer architecture • Hierarchical layers • The lower layers provide • services to the upper layers In pure layer architectures, service requests progress from top to down

Breaking and bypassing abstraction layers Callback • Callbacks can be used to break the idea of tier architecture without making lower level dependent of the upper Example: a typical business system Multidimensional layer architecture

Multidimensional layer architecture Distributed layer architecture • Tier architecture is easy to distribute • Communication between layers by messages Three tier architecture • Common in web-based systems: • Presentation layer / tier / front-end: part running in browser

• Application / logic layer: application level functionality, code (Ruby, Java, PHP, ASP, .NET, Perl, ...) executed by application server • Back end / Data tier: data base and management of data base, how to obtain stored data

Pros and cons of layer architecture • Pros • Applicable in most cases • Support understanding and mastering of the system • Decreases dependencies (maintenance, adaptability) • Easy to connect with the organization of the company (Conway)

• Support reuse (product framework) • Distribute easily • Cons • Performance can be compromised (indirection) • May lead to unnecessary or repeated computation • Exception handling • Pipes and filters architecture

Pipes and filters architecture consists of components (filters) that produce and consume data items, and channels (pipes) that carry data items from component to component.

Special case: pipeline Characteristics of pipes and filters architecture • Processing units are working independently (they don’t share state information) • Processing units do not know each other, only the data format required by the channels (pipes)

Information can be processed piecewise • • Units are stateless Concurrent units and buffering • Each unit in its own process • Slowest unit defines the total time • The sizes of buffers are critical • The buffer is typically a queue structure

Example: Photoshop Lightroom • The original picture is saved, the complete picture in the program is the original + operations • A filter can be removed  picture changes; exchange filters  picture changes again

• Converting e.g. for web publishing or paper printing • Ability to select the same operations for the whole picture library Pros and cons of pipes and filters architecture • Pros • Complex information handling process can be divided pieces that are easier to handle

• Supports reuse: process units can be combined in several ways • Supports maintenance: processing unit can be easily changed • Supports concurrency and distribution • Cons • Does not fit interactive systems (some exceptions like search engines)

• • Error handling may by difficult Information interpreting may cause performance problems
