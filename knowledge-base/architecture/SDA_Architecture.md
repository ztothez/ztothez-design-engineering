---

title: SDA_Architecture

source: SDA_Architecture.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Software Architecture Sampsa Rauti and Tampere University of Technology Outline • What is software architecture?

• Software architecture and quality requirements Software architecture • The components of the software (basic structure) • Relations between software components • Relations between the software and its environment

• The principles guiding design and evolution of the software Software architecture • Software architecture is not simply a static structure • It contains also functionalities and dynamic structures of the software

• Along with components and their relations, but also gives reasons for them • There are usually rules and principles on how to develop systems using a given architecture IEEE standard definition • “The fundamentals of organization of a system embodied in its components, their relationships to each other and to the environment, and the principles guiding its design and evolution.” (IEEE Standard 1471–2000.)

Architecture as a design principle • “Software Architecture is a set of design decisions about any system that keeps its implementation and maintainers from exercising needless creativity.” (D’Souza and Wills)

Architecture = law of the system • Given fundamental solutions • How to use given technology • How to use design patterns • How components communicate with each other • Etc.

Two different architecture views • Defined architecture • Definition of the system, specification will of the designer • Architecture of a specified system • Property of the system, defined by the system itself

Things affecting desicions of an architect Software architecture and quality requirements • Architecture is mainly about quality requirements • Any system can be implemented with any architecture, if only logical functionality is concerned

• Architecture is a way to take into account the quality requirements • Example: response time with normal load is 5 ms
