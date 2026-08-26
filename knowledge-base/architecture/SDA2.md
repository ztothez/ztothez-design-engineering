---

title: SDA2

source: SDA2.pdf

converted: 2026-08-25

---

## Design Smells

You begin developing software with a clear design vision. However, you encounter challenges as the project progresses. Your original design ideas need to be abandoned. Simple modifications become daunting due to unexpected consequences. This situation ultimately necessitates a comprehensive software redesign. Despite your initial good intentions, what went wrong?

Design Smells are symptoms of poor design. They represent common issues and problems in software design that should be avoided or addressed to improve the quality and maintainability of software systems. A design smell serves as an indicator that the design process may be veering off course, potentially spiraling out of control. When left unaddressed, serious cases of design smells can lead to missed project deadlines and escalating costs, as the software becomes increasingly difficult to manage and maintain.

To prevent these undesirable outcomes, adopting practices like incremental design and constant refactoring at multiple levels of the software architecture can prove highly effective. As we have seen previously, incremental design encourages a step-by-step approach to software development, allowing for the continuous assessment and adjustment of the design as the project progresses. Simultaneously, constant refactoring involves the systematic improvement of the codebase, eliminating design smells and ensuring that the software remains adaptable and manageable throughout its lifecycle. In this course, we will address the following seven design smells:

## 1. Rigidity

## 2. Fragility

## 3. Immobility

## 4. Viscosity

5. Needless complexity

6. Needless repetition

## 7. Opacity

## Rigidity

Rigidity in software design is characterized by the resistance to change. It occurs when making modifications to one part of the codebase causes ripples of changes that affect other interconnected modules. This lack of continuity in the codebase can lead to a situation where management is hesitant to implement any changes, eventually establishing a rigid policy against modifications. Rigidity in software design can also make the process of refactoring exceptionally challenging. A telltale sign of rigidity is often expressed as, ”Huh, it was a lot more complicated than I thought.”

If you encounter difficulties when attempting to implement even minor changes, it is likely an indication of rigidity within the design. For instance, the code may exhibit an excessive number of global or public variables, thereby reducing the codebase’s flexibility and introducing undesirable interdependencies. Additionally, an abundance of dependencies among functions or classes may exist, leading to unexpected consequences where modifications in one part of the code inadvertently impact other areas.

## Fragility

Fragility in software design is defined by its vulnerability to breaking. When changes are introduced, they often trigger cascading effects throughout the codebase, causing it to break unexpectedly in areas seemingly unrelated to the modifications. Furthermore, attempting to fix these problems can inadvertently lead to the emergence of new issues.

Telltale signs of fragility include certain modules consistently appearing on the bug list, a significant amount of time being dedicated to locating bugs rather than resolving them, and programmers exhibiting reluctance to make changes in the code due to the fear of introducing more issues. Fragility can impede the development process and increase maintenance efforts, making it essential to address promptly. If the program or a specific portion of it seems to break easily, or if modifying a function or class results in cascading effects, these are indicative signs of fragility.

## Immobility

Immobility as a design smell reflects the challenge of code reuse due to a complex and entangled structure that renders virtually any component immovable. An unmistakable indication of immobility occurs when a module exhibits potential for reuse, but the formidable effort and risk associated with separating it from its original environment make this endeavor impractical.

In other words, immobility occurs when the code intended for extraction becomes so interwoven with other code that it cannot be separated without impacting or including the intertwined code segments. Developers should proactively consider the potential for reusability within their design or specific components of it.

It is essential to construct classes, functions, and templates with their reusability in mind.

For example, imagine you have a large and complex software application with a core module responsible for handling user authentication. This module is deeply integrated into various parts of the application, and its functions and data structures are tightly coupled with other components. Now, you have a new project that requires a similar authentication mechanism, but with some modifications to meet the specific needs of this project. Because of the tight coupling and entanglement of the authentication module with the rest of the application, extracting it for reuse in the new project becomes practically impossible.

It is worth noting that design smells often tend to be intertwined. When issues arise within the design, it is common to find a multitude of different design smells cropping up simultaneously. When one aspect of a software design is problematic, it can lead to or make other design issues worse. For example, a complex and tangled codebase (immobility) can contribute to both rigidity and fragility.

## Viscosity

Viscosity in software design manifests in two ways:

• Viscosity of the software: In this context, viscosity means that making changes or additions to the codebase may appear easier if done in a way that compromises the intended design.

In other words, if it is more difficult for engineers to use the methods that preserve the design compared to the quick hacks, then the design is considered ”viscous.” It

is often tempting to take shortcuts that lead to quick but suboptimal solutions. High viscosity means the codebase resists proper changes and encourages shortcuts or sloppy solutions.

• Viscosity of the environment: This type of viscosity refers to the development environment itself. A high-viscosity environment is characterized by slow and inefficient processes, such as long compile times, extended feedback intervals during testing, and complex integration procedures in multi-team projects. As an example, when compile times become excessively lengthy, developers may feel compelled to implement changes that avoid triggering extensive recompilations, even if these changes are not ideal from a design perspective.

Indications of viscosity include the temptation to resort to hacks when changes are needed instead of preserving the original design. Additionally, developers may be hesitant to execute a fast feedback loop and tend to work on larger sections of code due to the challenges posed by the high-viscosity environment.

Needless complexity

Needless complexity in software design often stems from the inclusion of elements that are currently unnecessary, driven by an excessive anticipation of future requirements. Developers might unintentionally introduce unnecessary intricacies as they attempt to safeguard against potential future changes, deviating from agile principles that emphasize addressing present needs rather than attempting to predict the uncertain future.

Additional complexity should primarily be considered when designing an application framework or a customizable component. The key sign of needless complexity is investing significant effort and resources into addressing uncertainty, which can lead to an overburdened and convoluted design.

Needless repetition

Needless repetition in software design is characterized by the repeated appearance of similar code in slightly different forms. This repetition often occurs when developers miss the opportunity to create a suitable abstraction that

would allow them to reuse code efficiently. An important consequence of such repetition is that if bugs are identified in one instance of the repeated code, they must be fixed in every repetition, which can be both time-consuming and error-prone.

A clear indicator of needless repetition is the overuse of the copy-andpaste method to duplicate code segments, which can lead to maintenance challenges and hinder the ability to make consistent updates across all instances of the repeated code.

In many software projects, needless repetition is a common issue, manifesting as duplicated functions, variables, or classes. Developers often resort to copying and pasting existing functions or loops, making minor modifications to create new ones. This practice contributes to code redundancy and maintenance challenges.

## Opacity

Opacity in software design refers to the inclination of a module to become progressively harder to comprehend as time passes. This phenomenon often results in a situation where every module in the codebase becomes more opaque over time. Maintaining code readability becomes an ongoing effort that demands constant attention.

In contrast, well-designed code is easy to understand and effectively communicates its underlying design principles. A notable indication of opacity is when developers are reluctant to address issues within someone else’s code or even their own, as the complexity and lack of clarity make modifications and enhancements challenging and error-prone.
