---

title: SDA1

source: SDA1.pdf

converted: 2026-08-25

---

What is Software Design?

Software design is the process of defining how a software system will be structured and organized to meet its intended requirements and objectives.

Software design and the concept of design in traditional manufacturing industries do share similarities but also exhibit notable differences due to the nature of the products and processes involved.

Traditional engineering, often contrasted with software engineering, follows a well-established approach.

In this context, the design is carefully documented through blueprints or technical drawings, aiming to leave no room for ambiguity. Engineers place significant emphasis on ensuring the design’s correctness and meeting all specified requirements, recognizing that building the product involves substantial costs, and alterations or corrections are expensive and often impractical. Moreover, construction is carried out by distinct teams, necessitating that the blueprints encompass all essential information, as they serve as the definitive guide for the entire construction process. This traditional approach underscores the critical need for precision and thoroughness in the early stages to avoid costly mistakes and setbacks during implementation.

In software engineering, source code serves as the equivalent of blueprints in traditional engineering. However, unlike traditional engineering, the construction process in software engineering is performed by compilers and is virtually costless. This key distinction allows for the flexibility of repeatedly redoing and refining the construction, which is in stark contrast to traditional engineering where changes can be prohibitively expensive. Thus, the nature of software engineering differs significantly from traditional engineering due to the malleability and cost-efficiency inherent in the construction phase. Nevertheless, it is crucial to recognize that even though the construction process in software engineering may be cost-effective, the expense of modifying code underscores the importance of a well-executed original design.

In software engineering, the transition from design to the final product is not as distinct as it is in traditional manufacturing processes. The programmer operates at a level that encompasses both design and implementation, blurring the traditional boundaries between these stages. Software design and design in traditional engineering both validate feasibility. However, software design focuses on whether the software can meet functional and nonfunctional requirements rather than physical manufacturing constraints.

Software Crisis and Need for Methodologies

The ”Software Crisis” emerged in the late 1960s and marked a pivotal moment in the history of software engineering. It can be said that the crisis largely resulted from attempting to address software design challenges using methods from the traditional manufacturing industry. At that time, the field of software development was relatively new, and the industry was facing significant challenges in managing software projects effectively. Figure 1 list these challenges in software design, and many of the challenges are still, admittedly, relevant today.

Figure 1: Software development challenges during the software crisis.

The software crisis prompted the software engineering community to recognize the need for systematic and disciplined approaches to software development.

It paved the way for the development of software engineering methodologies, best practices, and standards that aimed to address these challenges. In response to the software crisis, various software development methodologies, such as the waterfall model, and much later, agile practices, were developed to improve project management, quality, and efficiency.

These methodologies introduced processes and techniques to better manage software projects, align them with user needs, and ensure software quality.

In the realm of modern software design, several notable challenges have are still present. The field is experiencing a new ”software crisis,” marked by the proliferation of extensive design work. This abundance of design complexity not only proves costly but also poses significant obstacles to maintaining and adapting software systems. The shift toward an iterative approach for

building large systems has redefined the role of design. Rather than a monolithic upfront task, design is crafted incrementally as a deeper understanding of the problem evolves, alongside the refinement of requirements.

This evolution has brought about a convergence of programming and detailed design. High-level constructs enable the translation of design concepts directly into code, while design patterns facilitate the expression of architectural designs. Consequently, programmers now operate at the design level, wielding a deep understanding of object-oriented principles to shape the software’s structure. This growing interdependence between programmers and software engineers underscores the evolving dynamics in modern software design.

The Waterfall model, shown in Figure 2, is a traditional and sequential software development methodology. It was developed in the 1950s and 1960s as a response to the challenges and complexities of managing large-scale software development projects. The model follows a strict, linear sequence where each phase must be completed before moving on to the next. In the initial phase, the project’s requirements are gathered and documented in detail.

This stage involves defining what the software should do, its functionality, and its constraints.

Figure 2: The waterfall model.

During the analysis phase, the gathered requirements are further examIn the design phase, the architectural and system-level

ined and refined.

design of the software is created. This phase outlines how the software will be structured and provides a high-level plan for its implementation. Once the design is complete, the actual coding or implementation of the software begins. Programmers write the code based on the design specifications. Finally, in the testing phase, the software is rigorously tested to identify and fix any defects or issues. This phase ensures that the software functions correctly and meets the specified requirements.

The waterfall model is known for its structured and well-documented approach. However, it also has several limitations, such as limited flexibility in accommodating changing requirements and a tendency to be less responsive to customer feedback. As a result, alternative methodologies like Agile were later developed to address these shortcomings and adapt to the evolving needs of the software industry.

Agile Software Development represents a shift in focus, valuing the expertise and craftsmanship of skilled developers over rigid process management by business-oriented individuals.

It minimizes the bureaucratic overhead traditionally associated with process management, allowing teams to concentrate more on productive work. A key requirement of Agile is the ability of developers to self-organize, promoting autonomy and responsibility within the team. Moreover, Agile is characterized by its iterative and incremental approach, where projects are divided into smaller, manageable segments, enabling continuous improvement and adaptation based on real-time feedback.

This methodology prioritizes collaboration, adaptability, and delivering value to customers in a more responsive manner, making it a popular choice in today’s fast-paced and ever-changing software development landscape. Agile empowers development teams to respond effectively to evolving requirements and market dynamics, ultimately leading to more successful and customercentric software projects. Unlike the Waterfall model, Agile also provides more detailed guidance on the software development process, including instructions on how to organize development teams and execute projects.

Iterative Development and Refactoring

Agile methodologies embrace iterative development cycles, such as sprints, with three core phases: 1) Planning, 2) Testing, and 3) Refactoring. First, planning serves as the initial phase of the Agile methodology, during which teams convene to precisely define the work to be accomplished in the forth-

coming sprint. Second, testing occurs continuously to maintain software quality and identify issues early. Lastly, refactoring is an ongoing practice to enhance code structure and adaptability. These phases ensure a responsive and adaptive approach to software development, allowing teams to deliver value during each increment and respond effectively to evolving requirements and feedback.

Agile can be seen as an iterative and adaptive approach that incorporates aspects of the Waterfall model, with the notable addition of the refactoring phase. While Agile retains sequential phases, it introduces continuous improvement through refactoring, ensuring software remains adaptable and responsive to change throughout development.

Refactoring involves systematically altering source code to enhance its design. This process aims to make the code more understandable and costeffective to modify while preserving its observable behavior, without prioritizing performance improvements.

Refactoring provides several key advantages:

• Improved Software Design: This practice involves not only creating a more structured design within existing code but also gradually adapting it to evolving functionality. This results in software that is more robust and maintainable. It is in the developer’s best interest to produce code that will adapt to changing requirements and increase the quality of design to allow future modifications.

• Bug Detection: Refactoring plays a crucial role in identifying and eliminating bugs. By clarifying the code’s purpose and structure, it becomes easier to spot and rectify issues, enhancing the overall quality and reliability of the software.

• Faster Programming: While the initial stages of a project may seem slower when refactoring is involved, it ultimately leads to faster and more efficient programming. Without refactoring, technical debt accumulates, making future development slower and more error-prone.

Refactoring helps to maintain a sustainable pace of development, ensuring long-term productivity.
