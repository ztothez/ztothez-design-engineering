---

title: SDA_DP_set3

source: SDA_DP_set3.pdf

converted: 2026-08-25

---

Design Patterns: Set 3  The V family ISITOR V ISITOR A V CYCLIC ISITOR D ECORATOR E O XTENSION BJECT  S TATE

V ISITOR  The V family allows new ISITOR methods to be added to existing hierarchies without modifying the hierarchies  Every derivative of the visited hierarchy has a method in V ISITOR  Dual dispatch: two polymorphic dispatches

Example: Modem Hierarchy «interface» Modem +dial() +send() +hangup() +receive() Hayes Zoom Ernie

Example: Modem Hierarchy (cont’d) «interface» «interface» Modem ModemVisitor +dial() +visit(Hayes) +send() +visit(Zoom) +hangup() +visit(Ernie) +receive() +accept(ModemVisitor) UnixModem Configurator Hayes Zoom Ernie

WindowsModem Configurator

Example: Modem Hierarchy (cont’d) public interface Modem { public void dial(String pno); public void hangup(); public void send(char c); public char receive(); public void accept(ModemVisitor v); } public interface ModemVisitor { public void visit(HayesModem modem); public void visit(ZoomModem modem); public void visit(ErnieModem modem); }

Example: Modem Hierarchy (cont’d) public class HayesModem implements Modem { | public void accept(ModemVisitor | v) { |     | | ------------------------------- | ---- | --- | v.visit(this); } /* rest of the implementation omitted */

} | public class UnixModemConfigurator | implements ModemVisitor | {   | | ---------------------------------- | ----------------------- | --- | | public void visit(HayesModem       | m) {                    |     | m.setConfigurationString("&s1=4&D=3"); }

| public void visit(ZoomModem m) { |     |     | | -------------------------------- | --- | --- | m.setConfigurationValue(42); } | public void visit(ErnieModem | m) { |     | | ---------------------------- | ---- | --- | m.setInternalPattern("C is too slow"); }

}

Example: Modem Hierarchy (cont’d)  To configure a modem for Unix, create an instance of the visitor and pass it to accept  The appropriate derivative calls visit(this)  New OS configuration can be added by adding a new derivative of the visitor

V ISITOR as a Matrix Unix Windows | Hayes | Initialization of  | Initialization of  | | ----- | ------------------ | ------------------ | |       | Hayes in Unix      | Hayes in Windows   | |       | Initialization of  | Initialization of  |

Zoom |     | Zoom in Unix       | Zoom in Windows    | | --- | ------------------ | ------------------ | |     | Initialization of  | Initialization of  | Ernie |     | Ernie in Unix | Ernie in Windows |

| --- | ------------- | ---------------- |

Observations  In V ISITOR  the visited hierarchy depends on the base class of the visitor hierarchy  the base class of the visitor hierarchy has a function for each derivative of the visited hierarchy

 A cycle of dependencies ties all the visited derivatives together  difficult to compile incrementally  difficult to add new derivatives of visited hierarchy  Visitor work well if the hierarchy is not modified often

| A CYCLIC | V ISITOR |     | | -------- | -------- | --- |  For a volatile hierarchy new derivatives are created quick compilation time is needed |  A CYCLIC | V ISITOR | breaks the  | | ---------- | -------- | ----------- | dependency cycle by making the visitor base class degenerate (i.e. it has no methods)

Example: Modem Hierarchy «interface» «degenerate» Modem ModemVisitor +dial() +send() +hangup() +receive() +accept(ModemVisitor) | Hayes       | Zoom        | Ernie       | | ----------- | ----------- | ----------- |

| «interface» | «interface» | «interface» | ZoomVisitor | HayesVisitor  |              | ErnieVisitor  | | ------------- | ------------ | ------------- | | +visit(Hayes) | +visit(Zoom) | +visit(Ernie) |

UnixModem Configurator

Example: Modem Hierarcy (cont’d) | public interface |                         | Modem               | {     |     |     | | ---------------- | ----------------------- | ------------------- | ----- | --- | --- |

|                  | public void dial(String |                     | pno); |     |     | |                  | public void             | hangup();           |       |     |     | |                  | public void             | send(char           | c);   |     |     |

|                  | public char             | receive();          |       |     |     | |                  | public void             | accept(ModemVisitor |       |     | v); | } | public interface |     | ModemVisitor |     | {   |     |

| ---------------- | --- | ------------ | --- | --- | --- | }

Example: Modem Hierarchy (cont’d) | public interface ErnieModemVisitor |     |     |     | {   |     | | ---------------------------------- | --- | --- | --- | --- | --- | public void visit(ErnieModem m); }

| public class |     | ErnieModem          | implements | Modem | {   | | ------------ | --- | ------------------- | ---------- | ----- | --- | | public void  |     | accept(ModemVisitor |            | v) {  |     | try {

ErnieModemVisitor ev = (ErnieModemVisitor)v; ev.visit(this); |     | } catch | (ClassCastException |     | e) { } |     | | --- | ------- | ------------------- | --- | ------ | --- | } /* rest of the implementation omitted */

}

Example: Modem Hierarchy (cont’d) public class UnixModemConfigurator implements ModemVisitor, HayesVisitor, ZoomVisitor, ErnieVisitor { public void visit(HayesModem m) { m.setConfigurationString("&s1=4&D=3"); } public void visit(ZoomModem m) { m.setConfigurationValue(42); } public void visit(ErnieModem m) { m.setInternalPattern("C is too slow"); }

}

Observations  Breaking the dependency cycle  easier to add visited derivatives solution is much more complex timing of the type casting is hard to characterize  A V is like a sparse CYCLIC ISITOR matrix

visitor classes do no have to implement visit functions for all visited derivatives

D ECORATOR  Allows attaching additional responsibilities to an object dynamically (i.e. at runtime)  Provides a flexible alternative to subclassing for extending functionality  Allows adding responsibilities to an object without adding methods to its interface

Example: Loud Dial Modem itsModem «interface» Modem +dial(…) +setVolume(int) HayesModem «delegates» LoudDial ZoomModem Modem public void dial(…) { ErnieModem itsModem.setVolume(11); itsModem.dial(…); }

Example: Loud Dial Modem (cont’d) public interface Modem { public void dial String(pno); | public void | setSpeakerVolume(int |     |     | volume); |     | | ----------- | -------------------- | --- | --- | -------- | --- |

} | public class | HayesModem |                 | implements | Modem | {   | | ------------ | ---------- | --------------- | ---------- | ----- | --- | | private      | String     | itsPhoneNumber; |            |       |     | private int itsSpeakerVolume; public void dial(String pno) { itsPhoneNumber = pno; }

| public void | setSpeakerVolume(int |     |     | volume) { |     | | ----------- | -------------------- | --- | --- | --------- | --- | itsSpeakerVolume = volume; }   }

Example: Loud Dial Modem (cont’d) | public class | LoudDialModem |           | implements | Modem | {   | | ------------ | ------------- | --------- | ---------- | ----- | --- | | private      | Modem         | itsModem; |            |       |     | public LoudDialModem(Modem m) { itsModem = m; }

| public void |     | dial(String | pno) { |     |     | | ----------- | --- | ----------- | ------ | --- | --- | itsModem.setSpeakerVolume(11); itsModem.dial(pno); } | public void |     | setSpeakerVolume(int |     | volume) { |     |

| ----------- | --- | -------------------- | --- | --------- | --- | itsModem.setSpeakerVolume(volume); }   }

Observations  Multiple decorators: base class decorator supplies the delegation code actual decorators derive from the base class and override only those methods they need  Cf.

Java I/O streams: BufferedReader keyboard = new BufferedReader( new InputStreamReader(System.in)); javax.swing.JScrollPane

E O XTENSION BJECT  More complex than V but more ISITOR powerful  Each object in the hierarchy maintains a list of special extension objects provides a method that allows the extension object to be looked up by name

 Extension object provides methods that manipulate the original hierarchy object

Example: Bill-of-Materials 0..* «marker» «marker» Part PartExtension BadPartExtension +getExtension(String) +addExtension(String, PartExtension) |      | «interface»      |     | «interface»      | | ---- | ---------------- | --- | ---------------- |

| 0..* | XMLPartExtension |     | CSVPartExtension | |      | +getXMLElement() |     | +getCSV()        | CSVAssembly Assembly XMLAssembly Extension Extension XMLPiecePart | PiecePart | Extension | CSVPiecePart |     |

| --------- | --------- | ------------ | --- | Extension

S TATE  Allows an object to alter its behaviour when its internal state changes the object will appear to change its class  Typically used to change the behaviour according to a state transition diagram

 Other implementations for an FSM nested switch/case statement transition table

Example: Turnstile FSM pass/alarm coin/unlock Locked Unlocked pass/lock coin/thankyou

Example: Turnstile «interface» Turnstile TurnstileState +coin() +coin(Turnstile) +pass() +pass(Turnstile) #lock() #unlock() #thankyou() #alarm() Turnstile Turnstile LockedState UnlockedState

Example: Turnstile (cont’d) public interface TurnstileState { public void coin(Turnstile t); public void pass(Turnstile t); } public class LockedTurnstileState implements TurnstileState { public void coin(Turnstile t) { t.setUnlocked(); t.unlock(); } public void pass(Turnstile t) { t.alarm(); }

} public class UnlockedTurnstileState implements TurnstileState { public void coin(Turnstile t) { t.thankyou(); } public void pass(Turnstile t) { t.setLocked(); t.lock(); } }

Example: Turnstile (cont’d) | public class | Turnstile | {   |     |     | | ------------ | --------- | --- | --- | --- | private static TurnstileState lockedState = new LockedTurnstileState(); private static TurnstileState unlockedState = new UnlockedTurnstileState(); | private | TurnstileController           |     | turnstileController; |           |

| ------- | ----------------------------- | --- | -------------------- | --------- | | private | TurnstileState                |     | state = lockedState; |           | | public  | Turnstile(TurnstileController |     |                      | action) { | turnstileController = action; }

| public void    | coin()          { state.coin(this); }      |                       |     |                         | | -------------- | ------------------------------------------ | --------------------- | --- | ----------------------- |

| public void    | pass()          { state.pass(this); }      |                       |     |                         | | public void    | setLocked()     { state = lockedState; }   |                       |     |                         |

| public void    | setUnLocked()   { state = unlockedState; } |                       |     |                         | | public boolean |                                            | isLocked()   { return |     | state == lockedState; } | public boolean isUnlocked() { return state == unlockedState; } protected void thankyou()   { turnstileController.thankyou(); }

| protected void |     | alarm()      { turnstileController.alarm(); } |     |     | | -------------- | --- | --------------------------------------------- | --- | --- | | protected void |     | lock()       { turnstileController.lock(); }  |     |     | protected void unlock()     { turnstileController.unlock(); }

}

| S TATE | vs. S | TRATEGY | | ------ | ----- | ------- |  Common context class delegation to a polymorphic base class that has several derivatives  Difference | S  | : derivatives hold a reference back to the  |     |

| --- | ------------------------------------------- | --- | TATE context class | S  | : no such constraint or intent |     | | --- | ------------------------------ | --- | TRATEGY  All instances of S are also instances of

TATE S TRATEGY

Observations  Very strong separation between actions and the logic of state machine  action in the context class  logic distributed through the derivatives of the state class  Simple to change one without affecting the other

 reuse the context class with different state logic  create subclasses of context class that modify the action without affecting the logic  Costs  writing state derivatives is tedious  the logic is distributed, no single place to see it all

Conclusion  Design patterns  Set 1 (COMMAND, ACTIVE OBJECT, TEMPLATE METHOD, STRATEGY, FACADE, MEDIATOR, SINGLETON, MONOSTATE, NULL OBJECT)  Set 2 (COMPOSITE, OBSERVER, ABSTRACT SERVER, ADAPTER, BRIDGE, PROXY, STAIRWAY TO HEAVEN)

 Set 3 (VISITOR, ACYCLIC VISITOR, DECORATOR, EXTENSION OBJECT, STATE)
