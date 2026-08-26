---

title: SDA4.2

source: SDA4.2.pdf

converted: 2026-08-25

---

Visitor The Visitor design pattern offers a powerful solution for enhancing existing hierarchies without the need to modify them directly. The Visitor pattern enables the addition of new methods to existing hierarchies seamlessly. This means you can introduce new functionalities to your codebase without altering the original hierarchy structure. In a Visitor-based design, every derivative within the visited hierarchy has a corresponding method in the Visitor, ensuring that each element can be properly processed. The Visitor pattern involves a dual dispatch mechanism, which combines two levels of polymorphic dispatch. This enables the Visitor to choose the appropriate operation based on both the type of the Visitor and the type of the visited element. By incorporating the Visitor design pattern, one can promote code extensibility and maintain the integrity of any existing hierarchies while accommodating future enhancements.

Figure 1: The Modem hierarchy.

As an example, consider the modem hierarchy depicted in Figure 1.

Within the Modem interface, we have the generic methods applicable to all modems. In this hierarchy, there are three derivatives showcased for different modems (Hayes, Zoom, Ernie). Let us address the challenge of configuring these modems for Unix without cluttering the Modem interface with an ConfigureForUnix method. To solve this, we employ the dual dispatch, which forms the core mechanism of the Visitor pattern.

Figure 2 illustrates the structure of the Visitor pattern, while Figures 3 and 4 show the corresponding Java code. It is noteworthy that within the

Figure 2: The Modem hierarchy with the Visitor design pattern.

visitor hierarchy, there exists a method for each derivative within the visited (modem) hierarchy. Configuring a modem for Unix involves creating an instance of the UnixModemConfigurator class and passing it to the accept function of the Modem. The appropriate Modem derivative will then invoke visit(this) on ModemVisitor, the base class of UnixModemConfigurator.

If the derivative is a Hayes modem, visit(this) will trigger the public void visit(Hayes) function in UnixModemConfigurator, which proceeds to configure the Hayes modem for Unix.

With this structure in place, the addition of new operating system configuration functions becomes straightforward. One can simply introduce new derivatives of ModemVisitor without making any modifications to the modem hierarchy. Consequently, the Visitor pattern substitutes derivatives of

ModemVisitor for methods within the modem hierarchy.

This approach is referred to as dual dispatch because it encompasses two polymorphic dispatches. The first occurs within the accept function, resolving the object type on which accept is invoked. The second dispatch involves the visit method, which is called from the resolved accept method and determines the specific function to execute.

In the context of the Visitor pattern, the visited hierarchy depends on the base class of the visitor hierarchy, and the base class of the visitor hierarchy has a function for each derivative of the visited hierarchy. A cycle of dependencies ties all the visited derivatives together, leading to difficulties

|     |        | Figure        | 3: Modem | and ModemVisitor.          | | --- | ------ | ------------- | -------- | -------------------------- | |     | Figure | 4: HayesModem |          | and UnixModemConfigurator. | in incremental compilation and the addition of new derivatives to the visited hierarchy. The Visitor pattern works best when the hierarchy remains

| relatively | static | and is not | frequently | modified. | | ---------- | ------ | ---------- | ---------- | --------- |

Acyclic Visitor The Acyclic Visitor design pattern is a practical choice when dealing with a constantly evolving hierarchy, where there is a regular need to create new derivatives and maintain quick compilation times. This pattern resolves dependency cycles by simplifying the visitor base class, essentially rendering it devoid of methods. This simplification streamlines development, particularly in dynamic hierarchy scenarios.

Figure 5: The Modem hierarchy with the Acyclic Visitor.

The Acyclic Visitor pattern is presented in Figure 5. In this pattern, a change has been made to the base class of the Visitor (referred to as ModemVisitor) to break a dependency cycle. This change involves making the base class degenerate, meaning it has no methods. Because the

ModemVisitor class has no methods, it no longer depends on the derivatives of the visited hierarchy. Instead, the visitor derivatives now derive from visitor interfaces. Each derivative of the visited hierarchy has its own visitor interface.

When an object from the visited hierarchy needs to accept a visitor, it does so by casting the visitor base class to the appropriate visitor interface in the accept function. If the cast succeeds, it invokes the appropriate visit

function defined in that visitor interface. Figures 6, 7, and 8 show the code implementing this pattern.

Figure6: TheimplementationforModemandthedegenerateModemVisitor.

Figure 7: ErnieModemVisitor and ErnieModem.

The advantage of this approach is that it breaks the dependency cycle, making it easier to add new derivatives to the visited hierarchy and perform incremental compilations. However, it also introduces complexity into the codebase, and the timing of the cast operation can be influenced by the width and breadth of the visited hierarchy, making it challenging to predict or characterize.

Figure 8: UnixModemConfigurator.

Decorator The Decorator design pattern allows for the dynamic attachment of additional responsibilities to an object at runtime. It provides a flexible alternative to subclassing for extending functionality, permitting the addition of responsibilities to an object without the necessity of adding methods to its interface. This design pattern enhances code modularity and maintainability by decoupling the client code from specific concrete implementations, promoting a more flexible and extensible architecture.

Letusconsider, onceagain, themodemhierarchy. Wehaveanapplication with multiple users, each using their computer’s modem to make calls. However, there is a variation in user preferences: some users prefer to hear the modem’s dialing sounds, while others prefer complete silence during the dialingprocess. ThechallengehereistoavoidmodifyingthecoreModeminterface to accommodate these user preferences. We do not want the Modem interface to be altered every time a user has a specific request, such as logging out before hanging up. The Single Responsibility Principle (SRP) applies here because the need for loud dialing is unrelated to the core functions of the

Modem and should not be part of it.

To address this, the Decorator design pattern comes to the rescue. It introduces a new class called LoudDialModem, which implements the Modem interface and delegates its operations to an encapsulated instance of Modem.

Specifically, LoudDialModem intercepts the dialing function and adjusts the

volume to be high before passing the operation to the underlying Modem | instance. | Figure 9 | illustrates  | this structure. |                     | | --------- | -------- | ------------ | --------------- | ------------------- |

|           | Figure   | 9: The Modem | hierarchy       | with the Decorator. | |           |          | Figure 10:   | The Modem       | interface.          |

Figure 11: LoudDialModem.

Now, the choice to dial loudly can be centralized in one specific location within the code. When a user configures their preferences, if they opt for loud dialing, we can create a new object called LoudDialModem and pass the user’s existing modem into it. The LoudDialModem will act as a wrapper and redirect all calls made to it to the user’s original modem, ensuring that the user does not experience any noticeable differences.

However, there is a crucial modification: the dial method in the class LoudDialModem will first adjust the volume to a high setting before passing the dialing request to the user’s modem. This way, the LoudDialModem effectively becomes the user’s modem, but the rest of the system remains unaffected by this change. This implementation is illustrated in Figures 10 and 11.

Extension Object Anotherapproachtoenhancingthefunctionalityofahierarchywithoutmaking direct changes to the hierarchy itself is to employ the Extension Object pattern. While this pattern is more intricate compared to others, it offers greater power and flexibility. In this pattern, each object within the hierarchy maintains a collection of specialized extension objects. Additionally,

each object provides a method to retrieve an extension object by its name.

These extension objects, in turn, provide methods to manipulate the original objects in the hierarchy.

Forinstance, letusconsiderascenarioinvolvingabillofmaterials(BOM) system. We need each object in this hierarchy to generate an XML representation of itself. While one option could be to include toXML methods directly in the hierarchy, we would prefer not to combine BOM and XML functionality within the same class. Utilizing a Visitor pattern for XML generation would also not allow us to separate the XML generation code for each type of

BOM object since all the XML generation code would reside within a single Visitor object.

Figure 12: The Extension Object design pattern.

This is where the Extension Object pattern offers an elegant solution.

It allows us to achieve the goal of separating XML generation for different BOM objects into their respective classes. This is illustrated in Figure 12. We can see the BOM hierarchy enhanced with two types of extension objects. One type is responsible for converting BOM objects into XML representations, accessible through getExtension("XML"). The other type transforms BOM objects into CSV (comma-separated value) strings, accessible through getExtension("CSV"). It is also worth noting that in Figure 12,

the ”marker” stereotype indicates a marker interface, which is an interface with no methods.

State The State design pattern provides a mechanism for an object to modify its behavior when its internal state changes. This change in behavior may make the object appear as if it belongs to a different class. Typically, this pattern is used to adapt an object’s behavior according to a state transition diagram, which outlines how the object should behave in different states. There are various implementations for managing finite state machines (FSMs), including nested switch or case statements and transition tables. The State pattern helps simplify the management of complex state-based behavior in an organized and maintainable way.

Figure 13: The turnstile state diagram.

Consider a turnstile, a straightforward access control device that permits or denies entry based on the insertion of a coin. The turnstile operates in two states: locked and unlocked. In the locked state, entry is denied, and any attempt to pass without inserting a coin triggers an alarm. In the unlocked state, the turnstile allows entry when someone passes through, signifying payment by coin insertion. In this state, there is no alarm, and a thankyou message is displayed. Figure 13 shows a state diagram illustrating this functionality, and 14 shows how the State pattern is used to implement it.

|     | Figure | 14: The | turnstile | states with | the State | pattern. | | --- | ------ | ------- | --------- | ----------- | --------- | -------- | The code in Figure 15 defines the TurnstileState interface and provides implementations for two concrete state classes: LockedTurnstileState and

UnlockedTurnstileState. These classes represent the behavior of the turn| stile in | its locked | and unlocked | states,  | respectively. |         |     | | -------- | ---------- | ------------ | -------- | ------------- | ------- | --- |

|          |            | Figure 15:   | The code | for turnstile | states. |     |

Figure 16: Turnstile.

Figure 16 shows the Turnstile class which serves as the context class of the State pattern. It encapsulates the state of a turnstile (locked or unlocked) and delegates behavior to the current state object, which is either lockedState or unlockedState. This context class manages the transitions between states and provides methods like coin and pass that delegate to the current state.

In the context of the State design pattern, there is a distinct and robust separation between actions and the logic of the state machine. Actions are defined within the context class, while the logic is distributed across derivatives of the state class. This separation allows for ease in altering one aspect without affecting the other. One can reuse the context class with different statelogicorcreatesubclassesofthecontextclasstomodifyactionsindependently of the logic. However, there are associated costs, such as the potential laboriousness of creating state derivatives and the challenge of having the logic dispersed without a centralized view.

In comparing the State and Strategy design patterns, there are both commonalities and differences. Both patterns involve a context class. They both delegate behavior to a polymorphic base class with multiple derivatives.

However,intheStatepattern,derivativesholdareferencebacktothecontext class. In the Strategy pattern, there is no such constraint or intent. It is

worth noting that the State design pattern can be viewed as a variation of the Strategy pattern, offering the ability to transition between different strategies by invoking methods defined within the pattern’s interface.
