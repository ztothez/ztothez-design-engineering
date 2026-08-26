---

title: Styles2

source: Styles2.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Architectural styles, part 2 Sampsa Rauti and Tampere University of Technology Architectural styles • Partitioning architectural styles • Layer / tier architectures (partition by structure)

• Pipers and filters architecture (partition by functionality) • Service-based architectural styles • Client-server architectures • Peer-to-peer • Message-passing architectures (publish-subscribe) • Special architectures

• MVC architectures • Interpreter architectures Service oriented architectures • Independent, independently maintained and managed components • Composing software from these components • No strict connections between components, using messages in communications

• Easy to distribute functions of components Client-server architure • Client-server architecture: the system consists of servers controlling resources and providing services, and clients needing services.

Client-server architecture • Services are available in sessions; services belonging together are controllably given during a connection as transactions.

• Clients and servers execute in their own processes, typically distributed.

• Clients are typically applications that do not know each other.

• Servers do not know clients.

• Servers typically manage a resource or data storage.

Examples • Data storage servers • Systems based on application servers • Email programs (server – terminal program) • Web applications etc.

• Most of the current applications and devices are (somehow) following client-server model.

Data storage and application servers Pros and cons of client-server architecture • Pros: • Eases controlling the common resource (security) • Eases maintenance and adaptability (changing the server) • Good technological support

• Cons: • Performance problems due to network traffic • Server-centric: sensible to failure on critical server • Exception handling Microservices • Variant of service-oriented architecture • Fine-grained services connected together with lightweight protocols.

Improves modularity • • Easier to understand, develop and test • Philosophy: “Do one thing and do it well” Microservices No industry consensus regarding the properties of microservices, missing official definition. Properties often include: • Services are processes communicating with each other using simple protocols (HTTP). However, other kinds of communication mechanisms are also possible (e.g. shared memory).

• Services might also run within the same process • Services should be independently deployable • Services are easy to replace • Services can be implemented using different SW technologies • Services are small in size, decentralized, often built and released with automated processes

Pros of microservices • Naturally enforces a modular structure.

• Lends itself to a continuous software development process.

• Provides characteristics that are beneficial to scalability.

Cons of microservices • Services form information barriers.

• Inter-service calls over a network have a higher cost in terms of latency and message processing time than in-process calls of a monolithic service process.

• Testing and deployment are more complicated.

• Moving responsibilities between services is difficult.

• Can lead to too many services when the alternative may lead to a simpler design.

P2P architecture • Specialization from client-server.

• Clients (peers) are also servers • Sharing resources, information, computing power, channel bandwidth, etc.

• Error-sensitiveness decreases, resource sharing makes it possible to solve bigger problems.

• Hybrids exist: centralized server and with P2P connections between clients.

P2 P architecure • Peer-to-peer (P2 P) network • consists of autonomous peers • is a self-organizing system • purpose: the usage of distributed resources • avoiding centralized services • P2 P is also used to hide the "culprit”

P2 P networks • Three requirements for future Internet systems • scalability • security, and reliability • flexibility, and the Quality of Service.

• Client-server architecture has some potential problems: • Centralized server and its network traffic are bottlenecks.

• It is easy to attack against the server.

P2 P: a new paradigm • P2 P is not just file sharing • P2 P is a new paradigm for distributed systems • coordination becomes co-operation • centralized becomes decentralized • participation provides incentives

P2 P application areas • Storage capacity, file distribution systems and technologies (e.g. torrents) • Computing power, distributed execution, e.g. Bitcoin • Botnets • Communication: • Skype (old version), centralized server, voice with P2 P

• Devices and machines communicating with each other.

Client server vs P2 P Pros and cons of P2 P architecture • Pros: • fault tolerance • sharing bandwidth and resources cause savings • easy to share resources, scalability • Cons: • security, safety • level of service

• complex implementations (hybrid model) Message passing architecture • Starting point • System consists of components communication with each other, possible distributed • Services of components are not known precisely in advance

• Components and number of them are not known precisely in advance • The quality of the information in systems is not known in advance Message passing architecture Examples IOT systems • Engine control systems

• • Multimodal systems, command-centric architectures • Business management system of a company • Generally: distributed systems, loosely coupled systems Example: car and CAN bus Messages • It is important to define the structure, contents, possible error handling etc. of the messages.

• Different kinds of messages: • Event messages • Request – answer message, • Command messages (remote procedure) • Data messages (information delivery) Pros of message passing architectures • Easy to change, add and remove components or applications.

• Fault tolerant (e.g. if there is no receiver for a message), the message can be sent repeatedly • Flexible system configuration • Allows heterogenetic systems, application integration • Allows both synchronic and asynchronic communication

Cons of message passing architectures • Performance: writing and reading messages • More difficult to implement, test and understand than traditional • Some ”ordinary” things need special support (e.g. returning

• the result, synchronization) Implicit connections created easily between units; virtually independent components hard to maintain and modify (especially if dependencies have not been documented)
