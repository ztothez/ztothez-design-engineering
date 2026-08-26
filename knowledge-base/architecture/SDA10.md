---

title: SDA10

source: SDA10.pdf

converted: 2026-08-25

---

| Architectural |     | Evaluation |     |     |     |     | | ------------- | --- | ---------- | --- | --- | --- | --- | Architectural evaluation differs from the inspection of many other technical artifacts in that its quality is not solely based on the technical merits during the design phase but also on its ability to meet longer-term objectives.

These objectives can include quality attributes such as security, modifiability, scalability, and performance. Since architectural design typically lacks other technical documents, decisions made during the design process are often grounded in business goals related to e.g. the company’s new system.

Architectural decisions serve as the foundation for architectural evaluation.

As we have seen earlier, architecture often dictates how well software meets qualitative requirements, and architecture is explicitly designed to meet these quality requirements. Consequently, architectural evaluation primarily focuses on assessing qualitative rather than functional requirements.

To comprehensively evaluate the qualitative aspects of the software, it is essential that the architecture incorporates all or at least the fundamental decisions affecting these qualities. This can be regarded as a criterion for architecturalcompleteness: ifaparticularqualitativeaspectcannotbeassessed based on the architecture, it is considered incomplete in that regard. However, this may not always hold strictly true. For example, the finer details of the user interface often significantly impact system usability, a qualitative requirement not visible at the architectural level. Similarly, the implementation approach in architecture can greatly affect system efficiency. The crucial point is that the architecture must facilitate the fulfillment of quality requirements within the framework of known implementation techniques.

| Common | quality | attributes | include, | for | example: |     | | ------ | ------- | ---------- | -------- | --- | -------- | --- | • Performance: The resources consumed by the system in processing a

| given | amount | of data, | events, or | users. |     |     | | ----- | ------ | -------- | ---------- | ------ | --- | --- | • | Reliability:    |     | The system’s   | ability | to remain | operational. |                 |

| --------------- | --- | -------------- | ------- | --------- | ------------ | --------------- | | • Availability: |     | The proportion | of      | time the  | system       | is operational. | • Security: The system’s ability to fend off unauthorized users without

| causing          | harm | to legitimate | users.    |          |     |     | | ---------------- | ---- | ------------- | --------- | -------- | --- | --- | | • Modifiability: |      | The ease      | of making | changes. |     |     |

112

• Portability: How well the system supports migration to different resource environments.

• Variability: How well the system accommodates variations in specific requirements.

In practice, these quality attributes can be combined to create more complex requirements, especially when the requirements partly conflict with implementation technology. It is important to note that the listed quality attributes are not necessarily straightforward and should not appear in system requirements without clarifications. For instance, the concept of modifiability should be explicitly defined with regard to which aspects of the system should be modifiable.

Functional requirements can also be assessed based on the architecture.

In this case, the focus is on determining whether a specific set of functions can be achieved with the given architecture, i.e., whether these functions can be implemented through interactions between the components within the architecture. However, this type of assessment is typically quite straightforward. It is sufficient to demonstrate (e.g., through a sequence diagram) that the required support for a particular function exists within the architecture, assuming that certain components are in place. Additionally, when introducing new features, architectural evaluation can serve as a straightforward way to present new requirements that may impact the architecture to the technical staff.

Architectural evaluation helps designers better understand the system and identify its problem areas. It compels designers to systematically review different aspects of the system and contemplate issues they might not otherwise consider. In this sense, architectural evaluation is also valuable when conducted retrospectively. Architectural evaluation also aids in predicting the system’s future evolution and, for example, maintenance costs. This information can be crucial for management, particularly in terms of resource allocation.

Architectural evaluation can be conducted at several key points in a project’s lifecycle: • Early Design Phase: Evaluation based on an architecture draft or preliminary architecture document. This helps identify potential issues andshortcomingsinthedesignbeforesignificantresourcesareinvested.

113

• BeforeImplementation: Evaluationafterthearchitecturaldesignphase, just before the start of implementation. This assessment ensures that the architectural design aligns with the project’s objectives and can be effectively translated into the actual system or subsystem.

• Existing Systems: Architectural evaluation is valuable for existing systems, especially when there is a need to renew or upgrade the system.

It highlights areas for improvement and guides the renewal process.

Evaluation is also essential when issues or problems are identified during development or when the system is in use. It guides the refactoring process to improve the system’s quality and maintainability.

Figure 1 illustrates the integration of architectural evaluation within the softwaredevelopmentprocess. Thearchitecturalframeworkisinitiallyshaped in accordance with functional requirements, environmental constraints, and limitations. Subsequently, the preliminary architectural design is refined to enhance its alignment with the quality requirements, typically through the application of recommended design practices and patterns. Following this refinement, the actual architectural evaluation can be conducted, leading to further improvements in the architecture.

While it is possible to evaluate the preliminary architectural design, it often represents a preliminary sketch, and it may not be advantageous to allocate significant resources to this evaluation. The accuracy of evaluation results depends on the quality of the description available to evaluators. A comprehensive architectural evaluation is conducted once the architectural design is complete, and the document describing the architecture is ready.

It is advisable to allocate a relatively significant amount of resources for this evaluation. This should occur before the implementation begins because the architecture may change as a result of the evaluation. Thus, the evaluation should be conducted before implementers start making decisions dependent on the architecture. However, a common challenge is that due to resource allocation and scheduling constraints, implementation often needs to commence during the architectural design phase.

There are many reasons for conducting architectural evaluation. Architecture serves as the initial detailed description of the system, making evaluation crucial for setting the foundation. Any deficiencies identified during this evaluation can be corrected at the earliest possible stage with relatively minimal costs. Evaluation verifies effective solutions while highlighting potential issues early in the development process. Evaluation also contributes

114

Figure 1: Architectural evaluation as a part of the the software development process.

to a deeper comprehension of the system’s intricacies, improving the development process.

Architecturalevaluationprovidesseveralotherpotentialbenefits. Ithelps in identifying development trends and potential risk areas, which in turn informs better decision-making during the development process. The evaluationprocessalsoaidsinsoftwarereformbyidentifyingtheprimaryareasthat require reform and reviewing related decisions. It can further be used to assess opportunities for expanding operations into new sectors and determining the necessary changes for such expansion.

Moreover, architectural evaluation can be a valuable tool for ensuring the qualityofsoftwaredevelopedbyexternalparties. Ithelpsrecognizeandrefine quality requirements that guide the design and development process. Additionally, the process facilitates the documentation of architecture solutions and their alignment with quality requirements, enhancing the overall understanding of the project. Furthermore, it contributes to the improvement of architectural documentation quality, making it more accessible and useful.

Lastly, architectural evaluation can increase communication and collaboration among project stakeholders, fostering a more productive development 115

environment.

Architectural Evaluation Methods Architectural evaluation methods typically provide answers to the following types of questions: • Does the planned architecture fit the system’s requirements, especially quality requirements? If not, it is essential to explain why.

• In situations with multiple alternative architectures (or parts of them), which one is the best fit for the system, and why?

• How good will a specific quality attribute of the system be, assuming it is implemented reasonably? For example, it might provide cost estimates for system maintenance.

The central challenge in architectural evaluation is how to extract information from the architecture description that accurately reflects the future system’s quality attributes. Many architectural evaluation methods are based on scenarios. These scenarios represent concrete situations that highlight specific quality attributes. For instance, if evaluating maintainability, a scenario might deal with a necessary change in the system’s evolution. When assessing performance, a scenario would focus on a performance-critical situationinsystemusage. Securityevaluationscenariosaddressthreatsituations duringsystemuse, andscenariosforreusabilityevaluatecreatinganewapplicationbyreusingthesystem. Afteridentifyingrelevantscenarios, theevaluation examines how well the architecture aligns with each one. Scenarios offer benefits like easy identification, concreteness, and comprehensibility. Figure

2 illustrates the process of refining quality attributes into specific scenarios, which can then be analyzed to identify potential architectural improvements.

In addition to scenarios, various checklists and questionnaires can serve as a basis for evaluation. These checklists and questionnaires pose queries relatedtoarchitectureorthearchitecturaldesignprocess, suchas, forexample, ”Is the user interface separated from the application logic?” These questions can be general and applicable to all architectures or tailored to specific application domains. These methods can also be combined with scenario-based techniques.

116

| Figure | 2: Refining | quality | attributes | to specific | scenarios. | | ------ | ----------- | ------- | ---------- | ----------- | ---------- | Another method for gathering information involves various measurement techniques aimed at obtaining precise numerical values that describe specific quality attributes of the system, such as performance or structural clarity.

This requires having a formal model of the system to measure. In the case of legacy systems, the source code itself can serve as a model, allowing for | the use of | software metrics. |     |     |     |     |

| ---------- | ----------------- | --- | --- | --- | --- | Typically, architecture descriptions are assessed by experts with experience in system design. The result naturally depends on the individual’s characteristics. Due to this subjective limitation, methods have been introduced for systematic evaluations that aim for a more objective assessment, | at least in | principle. |     |     |     |     |

| ----------- | ---------- | --- | --- | --- | --- | In this text, however, we will concentrate on scenario-based methods.

One of the earliest scenario-based methods is SAAM, developed at the Software Engineering Institute (Carnegie Mellon University). While primarily designed for evaluating modifiability-related quality attributes, it can also assess functionality. ATAM (Architecture Tradeoff Analysis Method), which we will explore next, is a more general method derived from SAAM at SEI

| and can also | be used | to evaluate | other quality | attributes. |     | | ------------ | ------- | ----------- | ------------- | ----------- | --- | 117
