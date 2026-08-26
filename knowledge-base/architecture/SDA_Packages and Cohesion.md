---

title: SDA_Packages and Cohesion

source: SDA_Packages and Cohesion.pdf

converted: 2026-08-25

---

Package Design and Factory Pattern Class and Package What is a class?

A package (namespace) is basically a collection of classes package (namespace) com.abc public class Shape { ...} public class ...

public class ...

## Why Package Design?

Size and complexity -> high level organization Classes are convenient for small applications, but too finely grained for larger ones Package is used to organize large applications Six Principles of Package Design

1. Reuse–Release Equivalence Principle 2. Common-Reuse Principle 3. Common-Closure Principle 4. Acyclic-Dependencies Principle 5. Stable-Dependencies Principle 6. Stable-Abstractions Principle Cohesion

Coupling Package Cohesion and Coupling  Cohesion within a package  ‘bottom–up’ view of partitioning  classes in a packages must have a good reason to be there  classes belong together according to some criteria

 political factors  dependencies between the packages  package responsibilities  Coupling between packages  dependencies accross package boundaries  relationships between packages  technical  political

 volatile REP: The Reuse–Release Equivalence Principle The granule of reuse is the granule of release.

 Anything we reuse must also be released and tracked  Package author should guarantee  maintanance  notifications on future changes  option for a user to refuse any new versions  support for old versions for a time

REP (cont’d) Primary political issues software must be partitioned so that humans find it convenient Reusable package must contain reusable classes either all the classes in a package are reusable or none of them are

Reusable by the same audience CRP: The Common-Reuse Principle The classes in a package are reused together.

If you reuse one of the classes in a package, you reuse them all.

CRP (cont’d)  If one class in a package uses another package, there is a dependency between the packages  whenever the used package is released, the using package must be revalidated and re-released

 when you depend on a package, you depend on every class in that package!

 Classes that are tightly bound with class relationships should be in the same package  these classes typically have tight coupling  example: container class and its iterators  The classes in the same package should be inseparable – impossible to reuse one without another

CCP: The Common-Closure Principle The classes in a package should be closed together against the same kind of changes.

A change that affects a closed package affects all the classes in that package and no other packages.

CCP (cont’d)  Single responsibility principle (SOLID) restated for packages  a package should not have multiple reason to change  Maintainability often more important than reusability  changes should occur all in one package

 minimizes workload related releasing, revalidating and redistributing  Closely related to OCP  strategic closure: close against types of changes that are probable  CCP guides to group together classes that are open to the same type of change

Recap: Cohesion Reuse–Release Equivalence Principle partition so that it is convenient to the users of the package Common-Reuse Principle partition so that the classes are tightly bound together Common-Closure Principle

partition so that a change is limited to one package only
