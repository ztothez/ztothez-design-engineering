---

title: ProductPlatforms

source: ProductPlatforms.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Product lines and frameworks Sampsa Rauti and Tampere University of Technology Definitions • Product family: a set of software products having a same kind of structure and functionality

• Product line: All the artifacts, tools and processes that support development and maintenance of product family members.

• Product line architecture: When the products share the product line, they share also its architecture Product lines Product line = reuse of software that are based on a common architecture and platform

Examples • Computer games (Angry birds, Candy Crush…) • Cellular phones • Banking systems • • Machine Control Systems Insurance systems Software development based on product lines • Key objectives: significant re-use, shorter development time, better quality with less resources, a consistent and streamlined development process, consistent products

• Prerequisites: A product family with sufficient common features and a well-understood variation is desirable: requirements must define scope, common requirements and variation points • Application area: videogames

Example • Easy to make new games with small changes • The performance and space requirements of the application get worse Pros of product lines • Extremely reused code and know-how • Special expertise of implementers decreased

• Accelerated product cycle • Productivity growth in the long run • Product standardization • Standardization of development process and tools • Quality improvement • Support fast prototypes Cons of product lines

• Staff turnover: motivation, expertise • Stiffens development • Conflict frameworks vs. products (coverage, schedule, resources, etc.) • Conflicts between desired properties of products • The first product takes a long time

• How to test a product line?

• Product-line focus may disappear • Quarterly economics What is a software framework?

• Traditionally: software framework is the object-oriented paradigm’s way to implement a product frame • Framework is formed of a collection of classes that implement the common architecture and functionality of a product family

• A framework is specialized to a product • Frameworks offer program’s (or its part’s) structure and implementation • Generalized frameworks offer (a part of) body for the application Frameworks vs. traditional libraries

• The Hollywood principle: Don’t call us, we call you Specialization mechanisms White box framework: specialization by inheritance and overloading methods Black box framework: specialization by instantiation (+parameters) and initialization configuration

Plugin framework: specialization by implementation of interfaces.

White-box framework Black-box framework Plugin framework Pros of frameworks Benefits of frameworks as implementation technology of product platforms: • A lot of experience (e.g. GUI frameworks) • Applies common, well-known OO technology

• Supports open variation points • Supports layered or hierarchical product platforms well • “Hard experts make the framework” Cons of frameworks • Technically demanding way to make the software, the process is often very iterative.

• The frameworks become easily large and complex software that is difficult to manage.

• Usage of time, costs, if only a single application is made.

• Testing of these applications can be difficult without framework’s code.

• Making an application on top of the frame: learning, flexibility, dependencies.

Conclusions • Traditional framework is the way of OO to implement product platform • Framework architectures are used widely in companies, experiences are mostly positive • Making a framework is much more demanding then writing a single application

• Avoid making white-box frameworks
