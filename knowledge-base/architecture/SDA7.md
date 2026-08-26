---

title: SDA7

source: SDA7.pdf

converted: 2026-08-25

---

The Meaning of Architecture Description Software architecture is the most significant information characterizing software. This is why communication among different stakeholders in software often involves architectural issues. In order for everyone to have a consistent understanding of software architecture, it should have a comprehensive and unambiguous description. Only based on such a description is it possible to express precise facts about the architecture – and the entire system, for that matter.

Architecture plays a crucial role as an enabling software artifact for rational communication. It not only provides essential software solutions but also the conceptual framework and terminology that enable discussions about the system. The architecture description is a key communication tool between the architect and the implementation or maintenance team. If the exact description of the architecture exists only in the architect’s mind, the team will undoubtedly make decisions that are inconsistent with that description.

Such problems may only emerge very late in the process and can cost the company significantly. Therefore, it is the architect’s responsibility to ensure that the team has access to an architecture description that precisely states what is part of the architecture and what the architecture allows.

For practical reasons, it is possible to consider that the architectural description is the concrete manifestation of software architecture: architecture does not exist without its description. This applies even when the system itself is in place. In such a situation, discussing the system’s architecture can be particularly hazardous because different individuals can easily form various interpretations of what constitutes the system’s architecture and what elements are included in it.

Software architecture is more of a specification concerning the system rather than an attribute of the system that can be directly inferred from it.

There are (semi)automatic techniques that can generate architectural-level information by reverse engineering the system, but such techniques typically produce the information required for describing the architecture, not full architectural descriptions.

As a long-term trend in software engineering, there is an effort to increase the abstraction level of software descriptions and produce working systems from higher-level descriptions. Architecture description is the highest level of solution description, so it could be thought that such a description could someday be used to automatically generate working systems. However, this

requires architectural descriptions to be precise and comprehensive, which may currently only be possible in a very limited sense, for example, within some narrow application domains.

Types of Architecture Software architecture can be described at different levels of abstraction. It can be provided, for example, as a general, abstract solution for certain types of systems, as a description of a common architecture for a family of systems, or as a description of a specific concrete system. When providing an architecture description, it is important to clarify the type of architecture being discussed.

Meta-architecture doesnotdescribesoftwarearchitectureitself,butrather the concepts and mechanisms used to provide actual architectural descriptions. In this way, meta-architecture can describe things like component categories and their relationships. An example of meta-architecture is the

UML profile, designed for describing (certain types of) architectures. In an abstract sense, one can think of meta-architecture as a grammar that guides the creation of actual architectures.

On the other hand, a reference architecture does not describe any specific system but provides a general solution for certain types of systems or their architectural components. Unlike meta-architecture, a reference architecture describes an architectural solution at an abstract level without tying it to any specific real-world system. For example, common architectural styles can be presented as reference architectures. It is also often meaningful to provide domain-specific (or even company-specific) reference architectures that describe proven architectural solutions and related concepts within a specific application domain.

A concrete architecture represents the architecture of a single software application. For example, the architecture document of a specific application always provides a concrete architecture, although it may refer to various reference and meta-architectures that the concrete architecture adheres to.

A product framework architecture describes the architecture of a software platform and provides rules for building individual software products on top of that platform. From the former perspective, the product framework architecture is a concrete architecture, while from the latter perspective, it may often include features of a meta-architecture. We will revisit product

framework architectures later in the text.

Finally, a product architecture isthearchitectureofanindividualsoftware product. Such a product may be built on top of a product framework, in which case it adheres to the product framework architecture, or it may be a completely independent application. In either case, the product architecture is concrete.

Architecture Documents The format and content of an architecture document can vary significantly depending on a company’s practices and the nature and scope of the particular system. In very small software projects, the architecture can be described as part of a general software document. However, in extensive systems, the architecture may be documented in several separate documents at different levels of abstraction. In all cases, it is crucial that the architecture description is a clear part of the documentation and easily locatable; otherwise, the concept of architecture becomes ambiguous. Architecture documents are a central means of communication among various stakeholders in the system.

Architectural documentation is one of the products of the software development process and typically has strong dependencies on other deliverables.

Typically, the architecture description refers to requirement documents when justifying certain solutions. Conversely, detailed design documents, test documents, and other technical documents refer to the architecture document.

The following are various types of architectural document commonly used in the industry. These types are not necessarily mutually exclusive; a single documentcansimultaneouslyrepresentmultipletypes. Similarly, thesetypes canalsoexistaschapterswithinmoregeneralsoftwaredocumentsratherthan in separate documents.

• Tentative Architecture Document: This document describes the key architectural decisions and their justifications as part of a feasibility study. The document may also analyze alternative solutions and their pros and cons. It is used for making business decisions, project planning, workload estimation, preliminary architecture assessment, and more detailed architectural planning. Typically, the document describes a concrete architecture, but it may also include reference architecture descriptions on which the given architecture is based.

• System Architecture Document: This document outlines the system architecture at its highest level. In the case of large systems, it describes the system’s interactions with its environment, the external features of subsystems (e.g., interfaces), and their interaction. Interaction can be depicted by detailing how key use cases are realized through interactions between subsystems. In smaller systems, the description may go down to the component level. This document is a key artifact for subsystem architecture design, architecture evaluation, detailed workload estimations, project planning, and system testing planning. Typically, the document describes a concrete architecture but may also include meta-architecture descriptions related to subsystems.

• Subsystem Architecture Document: In the case of extensive systems, important architectural decisions may also apply to subsystems. This document describes the architecture of a subsystem within the constraints set by the system architecture. The description defines the external characteristics (interfaces) of the subsystem’s components and their interaction. Interaction can be illustrated by elaborating on the abstractusecasespresentedinthesystemarchitecturedocumentatthe component level. This document serves as a basis for detailed subsystem and component design, work allocation, and unit testing planning.

The document describes a concrete architecture.

• Product Framework Architecture Document: Product framework architecture can be described in a similar way to any system architecture.

However, because the product framework serves as the implementation platform for other applications, its description has specific features. If the product framework architecture is visible to application developers, the document should describe how the variance offered by the product framework architecture is utilized in building applications. Providing examples of applying the product framework architecture is often sufficient, but a better alternative is to systematically describe the significance of the product framework architecture from the application builder’s perspective. Such a description often has characteristics of meta-architecture because it outlines the rules that applications must follow in their own architecture.

• Product Architecture Document: Aseparatearchitecturedocumentcan be given to a software product built on top of the product framework.

This document outlines how the product both applies the product framework architecture and makes product-specific architecture deci| sions | independently | of the product | framework. | | ----- | ------------- | -------------- | ---------- |

• Interface Document: This document complements other architecture documents by explicitly describing the software, subsystem, or product framework’s provided programming interface (API, Application Programming Interface). Services included in the interface can be specified using pre- and post-conditions, for instance. If the documented interfaceshavearchitecturalconsequencesforthesoftwareusingthem, these should also be described in the document. In such cases, the Interface

Document takes on characteristics of a meta-architecture document.

• A Reference Architecture Document: This document serves as a valuableresourceforunderstandinghowtoeffectivelyuseaparticulararchitectural framework. It offers guidance on leveraging the architecture, sharing insights on best practices and standards. Furthermore, it plays a crucial role in highlighting key considerations when adapting a similar architecture to new projects, ensuring consistency and alignment

| with | established | principles. |     | | ---- | ----------- | ----------- | --- | Generally speaking, the contents of an architecture document typically | include the | following items | (if applicable): |     |

| ----------- | --------------- | ---------------- | --- | • Identity: Information about the organization, system, and the docu| ment | itself. |     |     | | ---- | ------- | --- | --- | • Context: Business objectives, stakeholders, and the development envi| ronment | surrounding | the architecture. |     |

| ------- | ----------- | ----------------- | --- | • Requirements: Essential requirements for the architecture, which spec| ify | what the system | must achieve. |     | | --- | --------------- | ------------- | --- |

• Limitations: Anyconstraintsorlimitationsthataffectthearchitecture.

• Working environment: Information about the environment in which | the | system will operate. |     |     | | --- | -------------------- | --- | --- | • Views: The core of the description, including views from selected viewpoints, which help illustrate the architecture. A good option for presenting this part of the document is the 4+1 model, discussed later.

• Most important architectural decisions and their rationale: Adiscussion of key decisions made during the architectural design and the justifications behind them.

• Analysis: The results of the evaluation of the architecture, which may including found risks and potential improvements.

These components together provide a comprehensive overview of the architecture, its context, requirements, and how key design decisions were made.

Architectural Decisions The architecture of a software system can be seen as the collection and result of various architectural decisions. Architecture decisions are closely tied to various aspects of the system, such as requirements, concerns, and limitations. They are not arbitrary choices but rather responses to specific needs, constraints, orgoals. Forinstance, anarchitecturaldecisionmayaddresshow to meet a particular performance requirement or how to handle a security concern.

Each architectural decision is backed by a rationale. This rationale explains the ”why” behind the decision. It provides context and justification for choosing a particular design or approach. Understanding the rationale is crucial for stakeholders to appreciate the thinking behind the decision.

To ensure transparency and clarity, architectural decisions should be documentedwithinthearchitecturaldescription. Thisdocumentationbecomesan integral part of the architecture document. It serves as a reference for both the architectural team and other stakeholders, allowing them to understand the decision-making process and the reasons behind it.

Architectural decisions play a significant role in architecture evaluations.

When assessing the architecture’s quality or suitability, evaluators need to scrutinize these decisions. By examining how and why specific architectural choices were made, evaluators can assess whether the architecture aligns with requirements and concerns and whether it is a sound foundation for the system. This process helps ensure that the architecture meets its intended goals and is robust against potential issues.

Architectural Views and the 1+4 View Model Software architecture should describe the components within the system and the relationships between them. However, there are so many different relationships and aspects related to components that with such a general definition, it is difficult to know what should be included in the architecture description and what the structure of the description should be.

To address this, the concept of a viewpoint has been introduced: an architecture description consists of views of the system according to specific viewpoints. In this context, a viewpoint represents a general, system-independent way of describing a particular software feature relevant to the architecture.

A view is the actual system-dependent description that adheres to a specific viewpoint. The relationship between a viewpoint and a view is similar to that between a class and an object: a view is an instantiation of a viewpoint within a specific system.

Views in architectural documents describe different aspects of the architecture on various abstraction levels, which helps stakeholders understand and analyze the architecture from various angles. Each view focuses on specific concerns, such as structural, functional, or operational aspects of the architecture, making it easier to communicate and evaluate the system’s design. This is illustrated in Figure 1.

A viewpoint is orthogonal to the system’s structuring: in principle, any part of the system can be viewed from any viewpoint, although some viewpoints may be more meaningful for a specific part of the system than others.

ProposedbyPhilippeKruchtenin1995, theso-called4+1modelpresentsfive viewpoints for describing software architectures. Depending on the nature of the system, some of the viewpoints in the 4+1 model are crucial, while others may be less important. On the other hand, it is also possible that in some systems, additional viewpoints are necessary for the architecture description.

Here is a brief description of the 4+1 viewpoints and their corresponding architectural views: • Scenario View: The scenario view examines the system as a black box, focusing on describing how the system interacts with users and other systems in a specific usage scenario. The scenario view thus illustrates the system’s interfaces with its environment. Since usage scenarios typically involve the core functional requirements of the system, they serve as a basis for forming other views. Other views can also be evaluated

Figure 1: Architectural views.

based on the scenario view, assessing how the solutions presented in the view support that particular usage scenario. The scenario view is essential for almost all systems.

• Logical View: The logical view depicts how functionality is divided amongdifferentpartsofthesystemandwhatresponsibilitieseachcomponent holds. The logical view shows how the functionality presented in the scenario view is achieved through the collaboration of different parts of the system. The logical view can apply to both code structures (e.g., classes) and runtime structures (e.g., objects). It serves as a foundation for detailed design. The logical view is essential for all systems.

• Process View: The process view describes how the system’s operation is divided into logical processes and how these processes communicate with each other. The process view is crucial for systems that require concurrency (e.g., distributed systems). It helps assess aspects like system performance and scalability.

• Development View: The development view shows how the system is di-

vided into units that can be implemented separately. The development view is particularly important for large software projects. It is used in project planning, cost estimation, project management, and more.

• Physical View: The physical view illustrates the physical processing units that make up the system, how they are interconnected, and what physical software artifacts (e.g., components, resource files, databases, etc.) are allocated to each processing unit. The physical view is essential for distributed systems.

It is worth noting that as software architecture evolves and introduces variability, a sixth perspective, known as the variability viewpoint, can be incorporated to address how the architecture accommodates the system’s variability.

• Variability View: The variability view depicts the range of variations the system supports. This view outlines the system’s variation points (i.e., the locations in the system where variations can occur), their requirements, and how they are used to implement variations. The variability view defines the system’s extension interface and is crucial for product line architectures but can also be beneficial for software maintenance and assessing system reusability.
