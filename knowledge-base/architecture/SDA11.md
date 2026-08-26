---

title: SDA11

source: SDA11.pdf

converted: 2026-08-25

---

Architecture Trade-off Analysis Method (ATAM) The ATAM (Architecture Tradeoff Analysis Method) is a software architectural evaluation process that helps identify and analyze trade-offs in software architecture decisions. It involves a structured approach to assess the quality attributes of a system, such as performance, scalability, and maintainability, by considering various architectural options. ATAM employs scenario-based evaluation to make informed architectural decisions and is commonly used to improve the quality of complex software systems. The ATAM evaluation can be subdivided into four distinct phases: introduction, analysis, testing, and reporting, which will be elaborated upon in the subsequent sections.

Introduction The introduction phase consists of three steps. Firstly, the leader of the evaluation describes the ATAM method to all participants in the evaluation.

The goal is to describe the evaluation process, each role in it, the techniques used, and the form of the results. It is important that everyone has realistic expectations of the process.

Secondly, the project manager or customer representative explains the essential requirements and business objectives of the system, as well as the top-down constraints imposed on the system (e.g., technical, economic, political, etc.). The aim is for everyone to understand the system’s operating environment.

Thirdly, the system’s chief architect describes the architecture, its technical operating environment, and its interface with other possible systems.

The architecture description can use views (e.g., the previously presented 4+1 model); the essential aspect is that the perspectives on the system that have been crucial in the architecture design are presented.

Analysis The analysis phase consists of three steps. In the first step, essential architecturalsolutionsthathavebeenemployedtomeetspecificqualityrequirements areidentified. Typically, theseinvolvetheapplicationofvariousarchitectural styles and design patterns. Each solution is accompanied by an explanation of how it supports the quality attribute; what is essential in the solution

118

regarding the quality attribute, and what are the crucial questions when applying the solution. Answers to these questions can often be found in the | descriptions | of the respective | design patterns | or styles. |

| ------------ | ----------------- | --------------- | ---------- | In the second step, a utility tree (Figure 1) is created, specifying quality attributes and associating sample situations – scenarios – in which the quality attribute becomes evident. Each scenario is weighted with two parameters: how important the scenario is for the system and how difficult it is to implement. The latter parameter is high if building the system in a way that allows the scenario is resource-intensive. Generally, using a scale (low, | medium, | high) is sufficient. |                   |       |

| ------- | -------------------- | ----------------- | ----- | |         |                      | Figure 1: Utility | tree. | Now, there is a weighted utility tree with scenarios and descriptions of architecturalsolutions. Inthethirdstep,thesearelinked: each(atleasthighpriority) scenario is associated with the architectural solutions that support it. Based on the tree, it is possible to identify risks, non-risks, sensitivity

| points, and | trade-off points: |     |     | | ----------- | ----------------- | --- | --- | • Risk arises from an architectural decision that may potentially lead to a deterioration of a quality attribute (here, we only consider risks

119

arising from architecture, as projects may face risks from other sources as well). Risk can be described by specifying the decision or feature, the potential problem for the quality attribute, and the cause of the problem.

• Non-risk is an architectural decision that is evidently beneficial to the system’s quality attributes and is based on assumptions that can be expected to hold throughout the architecture. If these assumptions change, thenon-risksolutionnaturallyceasestobesafe. Anon-riskcan be documented by describing the underlying assumptions, the design decision, the resulting benefits for quality attributes, and the reasons for these consequences.

• Sensitivity point is an architectural decision that is critical for a specific quality attribute. If this feature is altered or the decision is abandoned, a certain quality attribute is at risk of deterioration. Sensitivity points explain why the system achieves a particular quality attribute. A sensitivity point is described by specifying the design decision in question and the quality attribute it depends on.

• A trade-off point is a sensitivity point that affects more than one quality attribute. Often, the resolution of a trade-off point has a favorable impact on one quality attribute and an unfavorable impact on another.

A typical trade-off point could be the application of a particular design pattern, with the design pattern’s description usually indicating the quality attributes it influences. Often, a design pattern enhances adaptability but degrades performance. A trade-off point is described by explaining the design decision in question and documenting how it affects quality attributes.

In the utility tree, the system’s quality is first specified into the most important general quality attributes. Then, these are further divided into more detailed categories, potentially spanning multiple levels as needed for the system. Finally, scenarios (sample situations) where the particular quality attribute becomes evident are attached as the leaves of the tree. Each scenario is associated with a letter indicating its importance and difficulty of achievement (the letters used in the figure are L = low, M = medium, H = high).

120

The utility tree is specific to the system, even though systems of the same type may also have similar utility trees. Common quality attributes are often the same across different systems, but in different systems, subsets of these or slightly differently emphasized quality attributes can be examined (e.g., modifiability vs. maintainability vs. portability).

Testing In the analysis phase, architectural decisions were primarily evaluated based onthearchitect’sandtheevaluationteam’sperspectives. Theprocessstarted with quality requirements and led to scenarios related to them. The purpose of the testing phase is to complement and test the results of the analysis by using scenarios produced by other stakeholders (e.g., testers, maintainers, customers, management). In this approach, scenarios are derived from the perspectives of stakeholders, aligning with their interests, and the process leads from scenarios to quality attributes. The goal is to stimulate discussion among different stakeholders and reach a common understanding of what is important in the system and which quality attributes need attention.

In the first step of the testing phase, stakeholders brainstorm scenarios from their own viewpoints. These scenarios can either be use cases, scenarios related to the expected changes, extensions, maintenance, and more in the system’s evolution, or stress scenarios based on radically new requirements. The latter type of scenario is aimed at pushing the boundaries of the architecture and finding new sensitivity points within the architecture.

Figure 2 describes different types of scenarios. The discovered scenarios are prioritized, often through a voting process.

Next, these scenarios are compared to the existing scenarios in the utility tree. If there is a match, everything is fine. If a scenario is not found in the tree but corresponds to an appropriate quality attribute branch, it becomes a new leaf on the tree. If a scenario is related to multiple quality attributes, it can be added to several locations in the tree, potentially with slight modifications to emphasize the relevant quality attribute. If a scenario does not fit into any branch in the tree, it either has no connection to quality attributes or is linked to a new, yet unidentified quality attribute. In the latter case, the tree is extended with the new quality attribute as a new branch, and the scenario is attached to it as a leaf. This is an interesting situation because it suggests that the architect may not have been aware of a specific quality requirement, and evaluating the architecture against this

121

|          | Figure       | 2: Different | types  | of scenarios | in  | ATAM. | | -------- | ------------ | ------------ | ------ | ------------ | --- | ----- | | scenario | is likely to | reveal new   | risks. |              |     |       |

In the second step of the testing phase, a similar analysis is conducted, but this time, it involves all stakeholders and pertains to the list of essential scenarios supplemented in the previous step. The architect explains how each such scenario is realized from the architectural perspective, i.e., which architectural solutions enable or support the scenario. If new scenarios are introduced, this might also reveal new critical architectural decisions that

| the architect | may not | have | previously | mentioned. |     |     | | ------------- | ------- | ---- | ---------- | ---------- | --- | --- | The final step of the testing phase is essentially a reevaluation of the previous analysis. If no new scenarios were found in the previous step, the scenarios from earlier are re-examined by a different group of participants.

| Hopefully, | this results | in little | new | information. |     |     | | ---------- | ------------ | --------- | --- | ------------ | --- | --- | Reporting At the end of the ATAM process, the results are presented to the entire group that participated in the evaluation. The results are also presented in

| an evaluation | report | prepared | after | the actual | evaluation | process. | | ------------- | ------ | -------- | ----- | ---------- | ---------- | -------- | The central goal of the ATAM method is to identify critical architectural decisions that affect quality attributes using scenarios as a tool and to analyze these decisions. The outcome of the evaluation provides information to understand the architecture and manage its risks: information about how the architecture relates to quality attributes. Occasionally, the outcome may also lead to immediate improvements in the architecture, although this is not

122

| the | primary | objective |     | of ATAM. |     |     | | --- | ------- | --------- | --- | -------- | --- | --- | The results of the analysis can be compiled by scenario (concerning prioritized scenarios) in a way that associates the architectural decisions that support each scenario with related risk points, secure solutions, sensitivity points, and trade-off points. These points are listed and numbered separately. Additionally, the scenario is linked to the quality attributes it tests, as well as a description of the conditions in which the scenario occurs.

ATAM’s developers recommend that, at the end of the evaluation, the evaluation team also compiles what are known as ”risk themes.” These are groups of risks that share the same underlying general cause. For example, a set of risks may be related to various data losses in hardware or software failures, and the risk theme might be insufficient attention to data backup.

The purpose of risk themes is to better connect risks to higher-level business | objectives |     | and make | them | more    | understandable | to management. | | ---------- | --- | -------- | ---- | ------- | -------------- | -------------- |

| Further    |     | remarks  |      | on ATAM |                |                | The phases we have outlined above are broken down into nine steps, as illustrated in Figure 3. A complete ATAM evaluation can be carried out within a span of two days, as indicated by the different colors in the figure.

Figure 4 provides an overview of the potential stakeholders engaged in the ATAM evaluation process and specifies which of them should participate on | each | day | of the | evaluation. |     |     |     |

| ---- | --- | ------ | ----------- | --- | --- | --- | Within the ATAM process, the following critical outcomes are achieved: • The identification of key architecture approaches, providing a founda|     | tional | understanding |     | of  | system design. |     |

| --- | ------ | ------------- | --- | --- | -------------- | --- | • Recognition of the most vital use and development scenarios, shedding |     | light | on crucial |     | system | functionality. |     |

| --- | ----- | ---------- | --- | ------ | -------------- | --- | • The creation of a quality attribute utility tree and scenarios, offering insights into the connection between quality requirements and archi|     | tecture | strategies. |     |     |     |     |

| --- | ------- | ----------- | --- | --- | --- | --- | • Identification and evaluation of potential architectural risks, essential |     | for | proactive | risk | management | in the design | process. |

| --- | --- | --------- | ---- | ---------- | ------------- | -------- | 123

|          | Figure | 3: The steps    | of the ATAM | evaluation. | | -------- | ------ | --------------- | ----------- | ----------- | |          | Figure | 4: Stakeholders | involved    | in ATAM.    |

| Pros and | Cons   | of ATAM         |             |             | In the process of conducting ATAM evaluations, there are potential challenges and advantages to consider. One crucial aspect is the investment of time and resources, as ATAM evaluations can be demanding in both aspects.

Itisessentialtoquestionthesensibilityandusefulnessofthechosenscenarios 124

and whether essential scenarios are effectively identified through forecasting.

Moreover, it is crucial to distinguish between known, found risks and those that may be hidden, requiring thorough examination. Prioritizing scenarios is a critical task in ATAM, ensuring that the most relevant ones are selected for evaluation. If relevant scenarios are inadvertently omitted, it can result in gaps or blind spots in the evaluation, potentially missing crucial insights.

However, a definite benefit of ATAM is its ability to bring together all stakeholders of the software, enabling open communication and collaboration. This process allows for the documentation of silent knowledge and the creation of a general understanding of the system among all involved parties.

Furthermore, ATAM serves as a platform where the concerns and problems of different stakeholders can be aired, and this transparency helps in addressing the most critical issues effectively. Overall, ATAM evaluations, while posing challenges, offer valuable insights and a holistic approach to architectural evaluation, enhancing the quality and effectiveness of software systems.

125
