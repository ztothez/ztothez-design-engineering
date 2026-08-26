---

title: SDA5

source: SDA5.pdf

converted: 2026-08-25

---

Architecture in Software Development In software development, there has been a shift from basic tools to larger structures. Initially, applications focused on simple operations on data in memory and registers. Later, the concept of structured data types and functions was introduced. This evolved into understanding larger application concepts that combine data and behavior through data abstraction, such as classes. Over time, the idea of individual applications became less distinct, with many sharing components and libraries. A key observation was that various applications often have similar underlying architectures. Software platforms were developed to provide a common infrastructure for such architectures. Theimportanceofarchitectureisseeninvariousaspectsofsoftware development, including incremental and parallel development, work division, testing, and maintenance.

Architecture provides a high-level, abstract view of software, enabling the examination of more complex systems and facilitating communication among various stakeholders. The establishment of architecture as a distinct field has supported the development and documentation of various standard solutions at the architectural level, allowing for clear guidelines on architecture usage and definition.

The significance of architecture is heightened by the fact that defining and documenting architecture enables early evaluation of critical aspects of the system, making changes cost-effective during the early stages of software development. The transition from problem-oriented concepts to solutionoriented concepts occurs during the architecture phase.

Failures in a system are often attributed to architecture. Poor architecture can manifest in various ways during system development, use, and maintenance. In the worst-case scenario, the system may not be implementable as intendedwithintheorganization. Architecturemay,forexample,makeincorrect assumptions about existing technology. Similarly, architecture can make implementation so difficult that it cannot be completed within the planned timeframe. Due to weaknesses in architecture, a system may struggle to efficiently handle even small amounts of data or users, or the architecture may make the user interface so slow that it becomes impractical. Architecture can also complicate system testing and maintenance if it does not support separate testing of components or modifications.

Failure can also occur after the successful implementation of the initial version. Since architecture is a key factor in software reusability, failure in

architecture design can essentially impede planned, extensive reusability.

Several factors can contribute to poor software architecture, including inadequate communication, neglect of essential requirements, architect’s lack of experience or assertiveness, inappropriate development processes for the architecture, and limited domain knowledge on the architect’s part.

What is Software Architecture?

Software architecture definesthefundamentalcomponentsandtheirrelationships within the software. These components form the basic structure of the system. Software architecture outlines the relationships between these software components, which are essential for the system to function effectively.

It also specifies how the software interacts with its environment, including external systems and users. Crucially, software architecture is guided by principles that influence the design and evolution of the software. These principles are the foundation of its development.

It is important to note that software architecture is not static. It includes not only the structure but also the functionality and dynamic aspects of the software. In addition to identifying components and their relationships, it provides the rationale behind these design choices. Often, specific rules and principles govern how systems are developed using a particular architecture.

In the literature, there have been various definitions of software architecture. The IEEE standard for describing architectures defines software architecture as the fundamental organization of a system, encompassing its components, their relationships, their interactions with the environment, and the guiding principles for system design and evolution. This definition encompasses not just the partitioning of a system into parts but also the relationships between these parts and their evolution. Since these relationships often involve runtime behavior, architecture concerns both structure and behavior. It extends beyond the static structure of the code to include dynamic structures during program execution, such as dynamic object structures.

For simplicity, software architecture is often examined from specific perspectives, logical view, physical view, or process structure. It is important to note that architecture includes justifications for certain architectural decisions, not just descriptions. Additionally, architecture typically comes with a set of rules and principles that govern how systems are developed based on that architecture. These rules may pertain to technology use, algorithm

selection, data structure solutions, as well as design and implementation patterns.

In essence, architecture serves as the constitution of a system. It must be adhered to during system development and can only be altered with compelling reasons. This perspective aligns with the views of d’Souza and Wills, who define architecture as a set of decisions that prevent implementers and maintainers from being excessively creative. In other words, architecture defines the boundaries within which a system must be built and maintained.

Architecture thus defines the core of a system, which remains largely unchanged during development and maintenance. Parts that fall outside this core can be freely adapted as needed.

Architecture-Driven Software Development In an architecture-focused software development process, the emphasis is on architecture design and evaluation as a central phase before transitioning to detailedplanningandimplementation. Thearchitectureisaimedtobedeveloped incrementally and iteratively, starting from architecturally significant requirements.

Architecture is influenced by both the most crucial functional requirements and the non-functional (qualitative) requirements. The initial version of the architecture is usually based on functional requirements and is then assessedagainstthequalitativerequirements. Ifnecessary, thearchitectureis refined to ensure each non-functional requirement is met. Figure 1 illustrates this process.

Software architecture is frequently influenced by numerous conflicting requirements, as depicted in Figure 2. Typically, one of the architecturally significant requirements is so much more important than others that it practically leads to a specific core architecture, to which other requirements are then accommodated. An essential role of architecture is to describe how – or to what extent –architecturally significant requirements are met by the given architecture. In this sense, architecture can be seen as a collection of highleveldesignsolutionsaimedataddressingcertain, particularlynon-functional requirements and the problems that stem from them.

It is also worth noting that architecture of the implementation platform often dictates the architecture for applications. Applications are constructed based on this enforced architecture, which raises the question of how to im-

| Figure | 1: Developing  | the architecture.     | | ------ | -------------- | --------------------- | | Figure | 2: Conflicting | quality requirements. |

plement specific requirements within this chosen platform. Software architecture requirements, when integrated with an implementation tool, need to be generic, suitable for various applications, understandable to regular programmers, precisely and clearly described, and presented from the viewpoint of an application programmer.
