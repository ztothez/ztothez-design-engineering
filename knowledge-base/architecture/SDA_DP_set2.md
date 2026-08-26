---

title: SDA_DP_set2

source: SDA_DP_set2.pdf

converted: 2026-08-25

---

Design Patterns: Set 2  C OMPOSITE  O BSERVER  A S BSTRACT ERVER  A DAPTER  B RIDGE  P ROXY  S H TAIRWAY TO EAVEN

COMPOSITE (1)  Partitioning pattern  Compose objects into tree structures to represent part-whole hierarchies  Composite lets clients treat individual objects and compositions of objects uniformly  Used when clients should ignore the difference between compositions of objects and individual objects

C OMPOSITE (2) 0..* «interface» Shape +draw() Circle Composite Shape Square «delegates» +add(Shape) +draw()

C and C OMPOSITE OMMAND 0..* Sensor Command Composite Command  Sensor and Command: one-to-one association  C provides a way to have one-to-many OMPOSITE behaviour without one-to-many association  list management and iteration appears only once in the composite class

 Cf. java.awt.geom.GeneralPath

O BSERVER (1)  An object (subject), maintains a list of its dependents (observers), and notifies them automatically of any state changes, by calling one of their methods  Mainly used to implement distributed event handling systems

 Key part in Model–View–Controller

O BSERVER (2)  Service call can be seen as a global event to which the related modules can react  creator and handler(s) of the event do not have to know one another → no direct dependency  Define an object keeps the data model (Subject)

 Delegate all ‘view’ functionality to decoupled and distinct Observer objects  register to Subject at creation  When Subject changes, it notifies all registered Observers  Observer can query Subject for the data that it is responsible for monitoring

 The number and type of Observers can be configured dynamically at run time

Synchronous Event-Handling Observers a b c x 60 30 10 y 50 30 20 z 80 10 10 a b c change notifications requests, modifications a = 50% b = 30% c = 20% Subject

O BSERVER : Pull Model 0..* «interface» Subject «observes» Observer +register(Observer) +update() +unregister(Observer) #notify() | Concrete    |             | Concrete  | | ----------- | ----------- | --------- |

| Subject     | «registers» | Observer  | | +getState() |             | +update() | +setState()

O BSERVER : Push Model 0..* | Subject | Observer |     | | ------- | -------- | --- | «observes» +register(Observer) +update(Message) +unregister(Observer) +notify(Message) | Concrete |             | Concrete |

| -------- | ----------- | -------- | | Subject  | «registers» | Observer | +getState() +setState()

Features  Use Observer when  an abstraction has two aspects, one dependent on the other  a change to one object requires changing others, and you do not know how many objects need to be changed  an object should be able to notify other objects without assumptions about these objects

 Observer is a widely used pattern: once you understand it, you see uses for it everywhere  you can register observers with all kinds of objects rather than writing those objects to explicitly call you

 Cf.

 java.awt.event.ActionListener  java.util.Observer and java.util.Observable

A S – A BSTRACT ERVER Motivating Example  Design software for a simple table lamp switch: on/off Switch Light light: on/off  The simple design +turnOn() +turnOff() violates DIP OCP

Example: A Bad Way to Extend Switch Switch Light +turnOn() +turnOff() FanSwitch Fan +turnOn() +turnOff()

Example: Extending Switch with A S BSTRACT ERVER «interface» Switch Switchable +turnOn() +turnOff() Light Fan +turnOn() +turnOn() +turnOff() +turnOff()

Who Owns the Interface?

 Interfaces belong to the client, not to the derivative Switch cannot be deployed without Switchable Switchable can deployed without Light  Inheritance hierarchies usually should not be packaged together

package clients with the interfaces they control  Cf.

java.io.Closeable, java.io.Flushable javax.swing.table.TableModel

A DAPTER (1)  Potential SRP violation in A BSTRACT S : ERVER Light and Switchable may not change for the same reasons what if Light cannot be inherited?

 Solution: add a class that can be adapted to the interface drawback: extra classes, instantations

A DAPTER (2)  Allows the interface of an existing class to be used from another interface  Often used to make existing classes work with others without modifying their source code

Example: Object-Form Adapter «interface» Switch Switchable +turnOn() +turnOff() «delegates» Light Light Adapter +turnOn() +turnOn() +turnOff() +turnOff()

Example: Class-Form Adapter «interface» Switch Switchable +turnOn() +turnOff() Light Light Adapter +turnOn() +turnOn() +turnOff() +turnOff()

BRIDGE  Decouple an abstraction from its implementation so that the two can vary independently  Uses encapsulation, aggregation, and can use inheritance to separate responsibilities into different classes

B – A Motivating Example RIDGE  Modelling animal characteristics  each type of animal can have different number of legs (integer)  each type of animal can have different type of movement: fly, walk or crawl

 an animal must be able to return the number of legs when asked  an animal must be able to calculate how long it would take to move a distance given the type of terrain  Variation in number of legs: a member variable with get/set methods

 Variation in movement type:  a member variable to indicate the type and to select different code for movement  tight coupling, messy code  animal types are derived from a base class  need to manage subtypes of animals

 no animals with more than one type of movement  subtyping based on one property; what about classifying them as mammals, reptiles and birds?

Example: Bridging Two Hierarchies «delegates» |     | Animal |     | Movement |     |     | | --- | ------ | --- | -------- | --- | --- | +move() | Bird | Reptile | Mammal |     |      |       | | ---- | ------- | ------ | --- | ---- | ----- |

|      |         |        | Fly | Walk | Crawl |  Encapsulate the behaviour (i.e.

movement) into a class  The animal class contains an object that has the appropriate behaviour

Commonality and Variability  Commonality analysis  what are the common elements among the elements  define a family to which the elements belong and a context where things vary  find the structure that is unlikely to change over time

 Variability analysis  how things vary within the context of commonality (variability only makes sense within a given commonality)  find the structure that is likely to change  Shortly: When the type hierarchy has more than one degree of freedom

 separate the hierarchies  tie them together with a bridge

P ROXY  Allows to cross a barrier without either of the participants knowing about it (3rd party APIs) database network  Theory: P can be inserted in ROXY between two collaborating objects without them knowing about it

 Reality: not so trivial…

Example: Web Shopping Cart 0..* Customer Order -name -date -address -status -billingInfo 0..* Item Product -name -quantity -price -sku

Example: Order Proxy «interface» Order «delegates» Order Order DB DB Proxy Implementation  Interface that declares all the methods that clients need to invoke  Class that implements those methods without knowledge of the database

 Proxy that knows about the database

Example: Order Proxy (cont’d) public interface Order { public String getCustomerId(); public void addItem(Product p, int quantity); public int total(); } public class OrderImp implements Order { private List<Item> itsItems; public int total() { int total = 0; for (Item item : itsItems) total += item.getProduct().getPrice() * item.getQuantity(); return total; }

/* rest of the implementation omitted */ }

Example: Order Proxy (cont’d) public class OrderProxy implements Order { public int total() { OrderImp imp = new OrderImp(getCustomerId()); ItemData[] itemDataArray = DB.getItemsForOrder(orderId); for (ItemData item : itemDataArray) imp.addItem(new ProductProxy(item.sku), item.qty); return imp.total(); }

/* rest of the implementation omitted */ }

S H TAIRWAY TO EAVEN  Achieves dependency inversion (like P ) ROXY  Employs a variation on the class form of A DAPTER  Only useful in languages supporting multiple inheritence  Completely seperates knowledge of the database away from the business rules of the application

S H TAIRWAY TO EAVEN (cont’d) Persistent Object Abstract class to DB +write() +read() Persistent Product Product Persistent Assembly Assembly

Invoking PersistentObject* o = dynamic_cast<PersistentObject*>(product); if (o) o->write();
