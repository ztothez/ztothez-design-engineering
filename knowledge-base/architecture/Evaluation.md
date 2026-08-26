---

title: Evaluation

source: Evaluation.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Architecture evaluation Sampsa Rauti and Tampere University of Technology Architecture documents Architecture and quality requirements • Software architecture is a way to fulfil quality requirements of the system, i.e. architecture defines how quality requirements are fulfilled.

• Architecture description has to include all the information needed to decide if the quality requirement is met or not.

• Architecture is (usually) assessed against quality requirements.

What is architecture evaluation?

• Evaluation of a software architecture refers to an activity that can be used to draw conclusions about how well a particular software architecture supports the implementation of the requirements of the system in question.

Why evaluate architecture?

• Architecture is the first precise description of the system.

• The evaluation confirms good solutions and draws early attention to potential problems • The evaluation will help to better understand the system Other possible benefits • Identification of development trends and potential development and the risk areas

• Software reform, identifying the main reform targets, and reviewing decisions • Opportunities to expand its operations into a new sector, the assessment of the necessary changes • The evaluation can be used to ensure the quality software made by others

• Recognition and refinement of quality requirements that direct the design • Recognition and documentation of architecture solutions and connecting them to the quality requirements Improvement of architectural documentation

Increasing communication • • When to evaluate?

• On the basis of an architecture draft (preliminary architecture document).

• After the architectural design, prior to the staring of implementation (system / subsystem architectural document) • Existing system (eg. Renewing the old system) • Need for refactoring when problems are found

Quality properties Results of analysis • Does the designed architecture fullfil the essential quality requirements? Why or why not?

• Which of the alternative architecture solutions is the best fit for the system? Why?

• How well can a given quality requirement be achieved by the designed architecture?

Result of analysis • The accuracy of evaluation results is based on the depends on the accuracy of description the evaluators have at their disposal In assessment, sensible implementation has to be assumed, and the architecture must make it possible

• Assessment of quality properties • There are no clear fulfilment criteria for quality properties.

• E.g. maintainability: system change should be easy if its usage environment changes.

• How to assess a property if there are huge number of different kind of situations, where the property is potentially endangered?

• Compare correctness – testing.

• General method: • Define goals for the system, and derive the quality properties from them.

• Refine the quality properties.

• Give an example of each quality property • Examine whether the quality property is fulfilled in the example.

Refining quality requirements by scenarios • Scenario = a situation or sequence of events that brings up if a quality requirement is fulfilled or not (on the view of a part of the system).

• Scenario makes the quality requirement concrete using example.

• Scenario has to be accurate enough to make assessment of the architecture possible – often precise numeric values.

• Compare traditional use case – functional requirement.

• Scenario = test case of the architecture.

Solution to architecture analysis: scenariobased assessment Using tools for architecture assesment • For an existing architecture assessment, different kinds of tools can be used (e.g. metrics tools, rulechecking tools, visualization tools, dependability analysts, analysts for copied code, remodeling tools).

• They are especially useful when analyzing maintainability and adaptability.

• Many tools work on code (static analysis)  might not produce architecture-level information.

• They can be utilized in scenario-based assessment e.g.

retrieving and prioritizing scenarios that target to ”suspicious” parts of the system.

Mining data out of architecture • Experts’ views • The main architect, architects that have designed similar systems, etc.

• Remodelling • The code can be abstracted by remodelling tool; this does not produce an actual architecture description but analyses different kinds of dependencies.

• Simulation • If there is an executable model, performance and reliability depending on the architecture can be examined; requires modelling of the system and a good tool.

• Metrics • Can be used as a rough tool to find out suspicious places (works mainly for maintainability) • Requires good tools.

• e.g. big classes, a lot of dependences between components.

Scenario-based evaluation methods • SAAM (Software Architecture Analysis Method) • Concentrates especially to adaptability, portability and maintenance.

• Developed at SEI (Software Engineering Institute, Carnegie-Mellon University) • Is based on evolution-time scenarios.

• ATAM (Architecture Trade-off Analysis Method) • Fits for all quality properties.

• Developed at SEI.

• Derived from SAAM.

• MPM (Maintenance Prediction Method) • Concentrates on maintainability.

• Tries to find relatively accurate cost estimation for maintenance.

• Developed by Jan Bosch • Is based on maintenance scenarios
