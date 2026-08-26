---

title: SDA_Architecture2

source: SDA_Architecture2.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Software Architecture Sampsa Rauti and Tampere University of Technology Outline • Why is software architecture important?

• Architecture and software development process • Architecture of the implementation platform Why is software architecture important?

• • It gives an abstraction level for solving the main problems associated with system development It is the central means of communication during the lifespan of software It sets limits and facilitates implementing the system

It supports system maintenance and reuse • • • The first representation of the system that can be analyzed and “tested” Consequences of a failed software architecture?

• The system cannot be implemented • The system is not finished in time • The system does not scale • The system is difficult to change and reuse • The system cannot be moved to another environment Reasons for bad software architecture?

• Bad communication • Essential requirements have been neglected • The architect is unexperienced or weak-willed • Development process does not support the architecture • The architect does not know the domain area

Developing the architecture Conflicting quality requirements Architecture evaluation • Many of the software quality properties can be deduced from the architecture description • For example: architecture with many layers might lead to performance problems

• Architecture evaluation = refinement of quality requirements + evaluation against the refined requirements (e.g. ATAM) • Architecture evaluation is testing the software using its first precise description

Making architecture up-front Sprint 0 Architecture in sprints Separate architecture team Requirements • Essential requirements are normally prioritized • Typically one or two quality attributes dominate the architecture

• Preserving the connection between architecture design and requirements is essential • How the system fulfills the quality requirements • Requirements keep changing during the system’s lifespan • “Walking on water and developing software from specifications are easy tasks – when both are frozen” (E.

Bevard) Software partitioning • Functionality • Generality • Distribution • Sensitivity change • Concerns Architecture of the implementation platform • Implementation platform often enforces a given architecture for applications

• The application is built based on this architecture • How to implement requirements on the chosen platform?

Requirements for the software architecture • When a specific software architecture is a part of an implementation tool, it has to be: • Generic: suitable for many applications • Understandable by a regular programmer

• Described precisely and understandably • Described from the viewpoint of an application programmer Conclusions • Description of the software enables mastering the system during its lifespan • There is a solid connection between software architecture the quality of the software: a large part of the architecture supports quality properties

• Software development has become architecture-centric • Using a given technology requires understanding its architecture
