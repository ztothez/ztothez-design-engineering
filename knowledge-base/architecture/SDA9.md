---

title: SDA9

source: SDA9.pdf

converted: 2026-08-25

---

Product Lines The key challenge in software production is software reuse: how to leverage the same components in multiple different software products. Software reuse has become a necessity in many areas, enabling the rapid development of new software products that meet high-quality requirements.

Systematic software reuse is always based on architectural-level solutions.

Inthebestcase,itispossibletoprovideaproduct line architecture,acommon softwarearchitectureforaproductfamily, andimplementaproduct platform, a software platform upon which individual products are built. Generally, the term product line refers to the entirety of artifacts, tools, and processes essential for the development and maintenance of product family members. In the context of software development, a product line involves reusing software components that are built upon a shared architecture and platform.

In the design of a product line architecture, potential differences in individual products are taken into account, allowing product-specific parts to be systematically implemented on top of the existing platform. Therefore, when built based on a product line architecture, products within a product family not only share features and similar structure but also share the same underlying architectural framework.

Product lines in the context of software architecture refer to a family of related software products that share a common foundation and architecture.

Some examples of product lines in different domains include: • Computer Games: Companies often create a series of games (e.g., Angry Birds, Candy Crush Saga) that share core gameplay mechanics, graphics, and code, while introducing variations and new levels.

• Cellular Phones: Manufacturers produce a range of smartphones that use a common operating system and software framework but may have hardware and software variations tailored to different market segments.

• Machine Control Systems: In industrial settings, machine control systemsmayhaveproductlinesforvariousmachines,withasharedcontrol software architecture adapted to specific machines’ needs.

Softwaredevelopmentcenteredaroundproductlinesaimstoachievemany key objectives, including substantial reusability, reduced development time, 105

improved quality with fewer resources, and a consistent, streamlined development process. By adhering to this approach, organizations can create products that exhibit consistency while conserving valuable resources. To effectively implement this, a product family with shared features and a welldefined understanding of variations is essential. The process necessitates clear requirements that define scope, common requirements, and variation points to be successful.

Figure 1: Using products lines in video game development.

Figure 1 illustrates an example of product lines within the context of video games. Employing the product line approach streamlines the development of new games with minor modifications, accelerating the development process after the initial investment in building a software platform for the family of video games. However, it is important to recognize that this convenience may come at a cost. The performance and space requirements of the application can degrade due to the incorporation of shared components for multiple games. It is important to note that the initial investment of building a product platform becomes more profitable as the number of games utilizing the platform increases. In this particular example, the threshold for profitability would be reached with at least three games.

106

| Pros and      | Cons of            | Product   | Lines |     | | ------------- | ------------------ | --------- | ----- | --- | | Product lines | have the following | benefits: |       |     | • Significant Code and Knowledge Reuse: Productlinesenabletheextensive reuse of code and accumulated knowledge across a range of related software products, maximizing efficiency and reducing redundancy.

• Reduced Dependency on Specialized Implementers: Therelianceonspecialized expertise of implementers is decreased as product line practices provide a structured framework for development, allowing a broader

| range | of team members | to contribute | effectively. |     | | ----- | --------------- | ------------- | ------------ | --- | • Faster Product Development: With established common components and architectures, the product development cycle is accelerated, re| sulting | in quicker time-to-market |     | for new products. |     |

| ------- | ------------------------- | --- | ----------------- | --- | • Long-Term Productivity Growth: Over time, product lines contribute to increased productivity as the benefits of code reuse and streamlined

| processes | accumulate. |     |     |     | | --------- | ----------- | --- | --- | --- | • Product Standardization: Product lines encourage the standardization of core features and functionalities, ensuring consistency across a prod| uct family. |     |     |     |     |

| ----------- | --- | --- | --- | --- | • Standardization of Development Processes and Tools: The adoption of a product line approach often leads to standardized development processes and tools, simplifying maintenance and quality assurance.

• Improved Quality: By reusing and refining components over multiple products, the overall quality of each product tends to improve as com| mon | issues are addressed | and | lessons learned | are applied. |

| --- | -------------------- | --- | --------------- | ------------ | • Support for Rapid Prototyping: The availability of pre-existing components and architectures within a product line can facilitate the rapid development of prototypes and proof-of-concept products, fostering in| novation | and experimentation. |     |     |     |

| -------- | -------------------- | --- | --- | --- | While product lines offer numerous advantages, they also come with several drawbacks: 107

• Staff Turnover Challenges: Thecontinuousmotivationandretentionof staffcanbechallenging, particularlywhenextensiveknowledgetransfer | is required | as  | employees | join | or leave | the project. | | ----------- | --- | --------- | ---- | -------- | ------------ |

• Stiffening Development Processes: The adherence to common components and architectures, while beneficial, can sometimes result in rigidity, making it more challenging to adapt to changing requirements of

| different | products. |     |     |     |     | | --------- | --------- | --- | --- | --- | --- | • Conflict Between Frameworks and Products: Managingconflictsrelated to coverage, schedule, and resource allocation can be complex when

| shared frameworks |     | must | cater | to various | product needs. | | ----------------- | --- | ---- | ----- | ---------- | -------------- | • Conflicts Among Desired Product Properties: Balancing the unique properties and requirements of individual products within a product

| line can | lead to | conflicts | that | need | careful resolution. | | -------- | ------- | --------- | ---- | ---- | ------------------- | • Long Initial Development: The first product in a product line often takes a longer time to develop as it involves building the core platform and architecture.

• Testing Challenges: Testing a product line comes with its own challenges. A product platform can be difficult or even impossible to test | in isolation | so  | that it | works | in all | possible configurations. |

| ------------ | --- | ------- | ----- | ------ | ------------------------ | • Potential Loss of Product-Line Focus: Over time, the initial focus on the product line’s shared components and benefits may diminish, lead| ing to divergence |            | in product |     | development. |     |

| ----------------- | ---------- | ---------- | --- | ------------ | --- | | Software          | Frameworks |            |     |              |     | A software framework is a structured way to implement a product platform in the object-oriented paradigm. It consists of a collection of classes that are designed to implement the common architecture and functionality of a product family. The framework is specialized to a specific product within that family. Frameworks provide the structure and implementation for programs or specific parts of programs, allowing developers to build upon the established foundation. In the case of generalized frameworks, they provide

108

a pre-built structure and, in some cases, a foundation for certain aspects of an application.

In frameworks, the specialized (application-specific) part of the code is often called by the framework itself, following the Hollywood principle – ”Don’t call us, we call you.” The framework takes the initiative and manages theflowofcontrol. Incontrast,withtraditionallibraries,theapplicationcode explicitlycallsandusesthelibrary’sfunctions,givingcontroltothedeveloper to decide when and how to utilize library features. Figure 2 illustrates the

Hollywood principle.

Figure 2: The Hollywood principle used in software frameworks.

Framework Specialization Mechanisms A white-box framework offers classes in its specialization interface that act as base classes for application-specific subclasses. These subclasses provide implementations for one or more of the base class’s operations. Additionally, the application developer typically provides application-specific initialization code that creates instances of these subclasses and registers them with the framework. After initialization, control is handed over to the framework, which invokes the services of application-specific objects following the Hollywood principle. In a white-box framework, the primary mechanism for specialization is inheritance.

White-box frameworks demand an in-depth understanding of their internal workings from developers, often failing to clearly encapsulate extensions within the framework, which has lead to criticism regarding their lack of

109

modularity. Additionally, the heavy reliance on inheritance often results in tight coupling, further complicating maintenance and adaptability.

A black-box framework is an intermediate between a traditional reusable library and a framework. In a black-box framework, the primary control resides within the framework, but the framework does not call applicationspecific code (i.e. the Hollywood principle is not followed). Specialization is achieved solely by creating instances of the framework’s classes with appropriate initialization parameters, forming desired configurations from these instances, and invoking their services with suitable parameters before handing control over to the framework.

In plugin frameworks, the primary specialization mechanism is implementing interfaces. The framework is specialized by implementing the interfaces contained within the framework using application-specific plug-ins and registering these implementations with the framework. A plugin typically consists of one or more classes or components. The framework automatically registers plugins by loading them from a designated directory. In this way, the framework can be specialized simply by placing the desired implementations in the plugin directory before the system’s startup.

Pros and Cons of Frameworks Frameworks often come with the advantage of having been developed and refined over time by a community of experts, who have in-depth knowledge of the domain and best practices. For example, in the case of many graphical user interface (GUI) frameworks, they have evolved through extensive use and feedback. This experience results in robust and feature-rich solutions that address a wide range of use cases and challenges.

Moreover, frameworks typically leverage common and well-established object-oriented technology and design principles. This makes it easier for developers to work with frameworks, as they are built on familiar concepts and paradigms. It also aids in code reusability and maintainability.

Frameworks are often designed with the flexibility to accommodate variations or customizations. They provide hooks or extension points where developers can tailor the framework to meet the specific needs of their project.

This open architecture encourages adaptability and allows for the creation of diverse products on the same foundation.

Frameworks are well-suited for creating layered or hierarchical product 110

platforms. They enable the separation of concerns into distinct layers, such as presentation, business logic, and data access. This modularity simplifies the development process and promotes maintainability, as changes in one layer do not necessarily impact others.

Adownsideofframeworksisthattheyoftenrequireatechnicallydemanding approach to software development, involving iterative processes that can be challenging for some developers, particularly those new to the framework.

Over time, frameworks can grow in size and complexity, making them harder to manage and maintain effectively. This complexity can lead to increased development time and effort. Testing applications built on frameworks can also be complicated when the framework’s code is involved, as it may necessitate specialized testing approaches and tools.

Buildingaframeworkoftenrequiressignificanttimeandresources, potentially resulting in high costs, particularly for smaller projects or startups. It is typically not cost-effective to develop a framework for a single application.

Building an application on top of a framework also involves a learning curve to master the framework’s intricacies. Additionally, applications developed with frameworks can be more dependent on the framework itself, potentially limiting flexibility and portability.

111
