---

title: SDA12

source: SDA12.pdf

converted: 2026-08-25

---

Package-level Design Principles A package, often also referred to as a namespace, serves as a way to organize classes and prevent naming conflicts by providing a unique namespace for the classes it contains. This helps in organizing one’s code and avoiding naming collisions, making it easier to manage and maintain large codebases.

Package design is essential because it offers high-level organization for managing the size and complexity of software projects. While individual classes are suitable for small applications, they become too detailed for larger ones. Packages are used to effectively organize and structure code in larger applications.

In this text, we will discuss six principles of package design that provide guidelines for effective package organization. The first three principles focus on cohesion, ensuring that packages are self-contained and logical. These are the Reuse-Release Equivalence Principle, the Common-Reuse Principle, and the Common-Closure Principle. The remaining three principles concentrate on reducing coupling between packages: the Acyclic-Dependencies Principle, the Stable-Dependencies Principle, and the Stable-Abstractions Principle.

In the context of package design, we consider both cohesion within a package and coupling between packages. Cohesion, the ”bottom-up” view of partitioning, ensures that classes within a package have a clear purpose for being together, based on specific criteria, which can include political factors, package responsibilities, and dependencies. Coupling, on the other hand, deals with dependencies that cross package boundaries, involving technical and political factors, as well as volatile relationships between packages.

Reuse-Release Equivalence Principle The Reuse-Release Equivalence Principle (REP) asserts that ”the granule of reuse is the granule of release.” This means that anything intended for reuse must also be properly released and tracked. To adhere to this principle, package authors have several responsibilities, including ensuring maintenance, providing notifications of future changes, offering users the option to refuse new versions, and supporting older versions for a certain period. This ensures a smooth and reliable process for reusing and maintaining packages.

REP primarily addresses political considerations. Software partitioning should be user-friendly, making it convenient for humans. A reusable pack126

age should consist of reusable classes, and it is an all-or-nothing proposition; either all classes in a package are reusable, or none of them are. Additionally, reusability should cater to the same audience, ensuring consistency and compatibility among users.

The Common-Reuse Principle The Common-Reuse Principle (CRP) states: ”The classes in a package are reused together” and ”If you reuse one of the classes in a package, you reuse them all.” This principle underscores the idea that related classes within a package should be treated as a cohesive unit for reuse. It helps maintain consistency and ensures that all necessary components are used together for effective functionality.

The CRP emphasizes several key points: • When one class in a package uses another package, a dependency between the packages is established. This means that whenever the used package is released, the using package must undergo revalidation and re-release. In essence, when you depend on a package, you depend on every class within that package.

• Classes that have strong and interrelated relationships, typically displaying tight coupling, should be placed in the same package. A common example of this is a container class and its associated iterators.

• In the same package, the classes should be inseparable, making it impossible to reuse one class without including the others. This design approach ensures that related classes are kept together for effective reuse and maintenance.

The Common-Closure Principle The Common-Closure Principle (CCP) states: ”The classes in a package should be closed together against the same kind of changes.” and ”A change that affects a closed package affects all the classes in that package and no other packages.”

127

CCP essentially restates the Single Responsibility Principle (a part of SOLID) for packages, emphasizing that a package should have a single responsibility or a single reason to change. In many cases, maintainability is more crucial than reusability. Concentrating changes within one package reduces the workload related to releasing, revalidating, and redistributing code.

CCP aligns closely with the Open-Closed Principle (OCP), especially in terms of strategic closure. It encourages grouping classes that are open to the same type of change, allowing for better adaptation to expected changes in the software. This principle reinforces the idea that packages should be organized logically and purposefully to facilitate maintainability and minimize disruptions caused by changes.

The Acyclic-Dependencies Principle The Acyclic-Dependencies Principle (ADP) stresses the importance of avoiding cycles in the package dependency graph. By eliminating cycles, it becomes easier to compile, test, and release software in a ’bottom-up’ manner.

When cycles exist, packages within the cycle effectively merge into one, leading to increased compile times, testing complexity, and potential developer conflicts due to version dependencies.

The”Morning-AfterSyndrome”describesascenariowheredevelopersare concurrently modifying the same source files to accommodate recent changes madebyothers,resultinginalackofastableversion. Twopotentialsolutions are possible: Solution #1: This solution involves a weekly build: Developers mostly work individually during the week and integrate their changes on Fridays.

This approach suits medium-sized projects, but for larger ones, the integration iteration might become longer (e.g., monthly builds), potentially leading to a loss of rapid feedback.

Solution #2: This solution involves partitioning the development environment into releasable packages while ensuring adherence to the AcyclicDependenciesPrinciple(ADP).Thisapproachaimstopreventpackagecycles and facilitate more controlled development and integration, thereby addressing the ”Morning-After Syndrome.”

In the concept of ”Release-Control,” the development environment is divided into releasable packages. Each package acts as a unit of work for 128

developers, enabling them to make private modifications. Developers release their working packages, and others can use them while developers continue making private modifications for future releases. This approach ensures that developers work independently on their packages, deciding when to adapt them to new releases of packages they use. It eliminates the need for a

”big bang” integration and promotes small, incremental changes. To prevent the ”morning-after syndrome,” it’s essential to maintain a dependency tree without any cycles, following the Acyclic-Dependencies Principle (ADP).

Ensuring package structure can be represented as a Directed Acyclic Graph (DAG) is a helpful approach when trying to break cycles. A DAG ensures that there are no loops or cycles in the package dependencies (see

Figure 1), aligning with the Acyclic-Dependencies Principle (ADP). Practical methods for breaking cycles in package structure include applying the Dependency Inversion Principle (Figure 2) and introducing new packages (Figure 3).

Figure 1: Ensuring package structure forms a Directed Acyclic Graph.

When breaking cycles in package structure, it is good to remember that packagestructuredoesnotfollowatop-downdesignbutevolvesasthesystem grows and changes. Package dependency diagrams primarily serve as a map for the buildability of the application, rather than reflecting its functionality.

129

| Figure              | 2: Breaking cycles | with Dependency       | Inversion | Principle. | | ------------------- | ------------------ | --------------------- | --------- | ---------- | | Figure              | 3: Breaking        | cycles by introducing | new       | packages.  |

| Stable-Dependencies |                    | Principle             |           |            | TheStable-Dependencies Principle (SDP)advisesto”dependinthedirection of stability.” Designs need some degree of flexibility and adaptability to facilitate maintenance. While some level of volatility is necessary, the Common

130

Closure Principle (CCP) suggests that certain packages may be sensitive to | specific | types of changes. |     |     |     | | -------- | ----------------- | --- | --- | --- | Theprincipleofstabilityemphasizesthatavolatilepackageshouldnotbe relied upon by a package that is challenging to change. This precaution prevents a package designed for ease of modification from accidentally becoming difficult to change due to unexpected dependencies being introduced.

Thestability ofapackageisdeterminedbyhowchallengingitistochange, taking into account factors such as its size, complexity, clarity, and the number of incoming dependencies. In general, if other packages depend on a package, it becomes harder to change, making it more stable due to the

| increased | effort required | to modify | it.                   |     | | --------- | --------------- | --------- | --------------------- | --- | |           |                 | Figure    | 4: Stability metrics. |     |

Figure 4 shows some package stability metrics. Instability metric I is calculated from afferent and efferent couplings. The instability of a package shouldalwaysbelargerthantheI metricsofthepackagesthatitdependson.

This is illustrated in Figure 5. Figure 6 shows how such stability violations | can be | fixed by applying | the Dependence | Inversion | Principle. | | ------ | ----------------- | -------------- | --------- | ---------- |

131

Figure 5: The I metric of a package should be larger than the I metrics of | the packages           | it depends | on.                   |                 |      | | ---------------------- | ---------- | --------------------- | --------------- | ---- |

|                        | Figure     | 6: Fixing a stability | violation using | DIP. | | The Stable-Abstraction |            |                       | Principle       |      | The Stable-Abstractions Principle (SAP) suggests that ”a package should be as abstract as it is stable.” This principle emphasizes that a stable package should also be abstract, ensuring that stability does not hinder its extensibility. Conversely, an unstable package should be concrete because instability

132

allows for easy changes to the concrete code. The combination of the StableDependencies Principle (SDP) and SAP aligns with the Dependency Inversion Principle (DIP) for packages, where dependencies run in the direction of abstractions. To manage varying degrees of abstractness in packages, a

| metric is needed | to measure | a package’s | level of abstractness. |     | | ---------------- | ---------- | ----------- | ---------------------- | --- | Tomeasureabstractnessinapackage, considerfactorssuchasthenumber of classes in the package N and the number of abstract classes (N ) within c a that package. Abstractness (A) is then calculated using the formula A =

Na/Nc, with A = 0 indicating no abstract classes and A = 1 indicating that | all classes are | abstract. |     |     |     | | --------------- | --------- | --- | --- | --- | Figure 7 provides a two-dimensional perspective on abstractness and instability. The main sequence highlights a correlation that developers should aim for. Low instability, signifying a very stable package, is associated with high abstractness. Extremely instable packages should be highly concrete, while extremely stable packages should be be highly abstract. The ”zone of uselessness” indicates that a highly abstract package with no dependencies

| serves no practical | purpose.           |         |              |                  | | ------------------- | ------------------ | ------- | ------------ | ---------------- | | Figure              | 7: The correlation | between | abstractness | and instability. |

133
