---

title: SDA_whatisdesign

source: SDA_whatisdesign.pdf

converted: 2026-08-25

---

WHAT IS DESIGN?

What is Design?

 Design a Car vs. Construction a Car What is Design?

 Design a Software vs. Building (Coding) a Software  Design is a creative process There is no construction work or algorithm Historical perspective: Software Crisis  Software Crisis was first mentioned at the NATO

Software Engineering Conference in 1968  Reasons:  Projects running over-budget.

 Projects running over-time.

 Software was very inefficient.

 Software was of low quality.

 Software often did not meet requirements.

 Projects were unmanageable and code difficult to maintain.

 Software was never delivered.

Modern Software Design Challenges  The new software crisis: the bloat of design work  expensive  opposes maintainability and adaptability  Iterative way of building large systems changes the role of design

 the design is created piece by piece as the understanding of the problem grows  Programming and detailed design are unifying  high-level constructs allow to express the design in the code  design patterns allow even to express the architecture design

 The role of the programmer is rising  operates at the design level  understands the profound object-oriented principles  Programmer and software engineer tend to be more dependent Three Perspectives on Software

Development  Conceptual  represents the concepts in the problem-domain  objects defined in the terms of responsibilities  Specification  focuses on the software at the level of interfaces (not the implementation)

 how the modules are connected  Implementation  looks inside the modules, the code  probably the most often used perspective (should not be)  objects are seen as encapsulating data and providing access to services

Design Programming Traditional Engineering…  The design is expressed in the blueprints  Engineers try to make absolutely sure that the design is correct requirements are met the product will function as specified

##  Why?

building the product is expensive construction cannot be undone (or it is expensive to do so)  Construction is done by different people → The blueprints must contain all information needed for construction

…and Software Engineering Source code is the blueprints Compiler does the actual construction work Since construction is virtually costless it can be redone over and over again!

traditional engineering ≠ software engineering The Waterfall Model Requirements Analysis Design Implementation Testing Agile Software Development Values good old engineering skills over the exact process management of business people

Reduces the overhead from process management to minimum Requires that the developers can self-organize Iterative and incremental!

Three phases of development Planning Testing Refactoring Refactoring Practical definition: altering the source code systematically to improve its design easier to understand cheaper to modify does not change its observable behavior

the goal is not better performance Benefits of Refactoring  Improves the design of the software creates the design in the existing code adjusts the design piece by piece to changing functionality  Helps in finding bugs

clarifies the purpose of the code to a point where you simply cannot avoid seeing the bugs  Helps in programming faster without refactoring you start faster but lose speed after a while
