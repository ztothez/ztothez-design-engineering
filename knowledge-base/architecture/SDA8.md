---

title: SDA8

source: SDA8.pdf

converted: 2026-08-25

---

Architectural Styles An architectural style is a standardized model that outlines how a system is structured at its highest level of abstraction. It defines the fundamental technical characteristics and principles that shape the system’s design and organization. It is important to note that architectural styles are not mutually exclusive. In practice, multiple architectural styles can coexist within a single system, each addressing specific aspects of the design.

Selecting an appropriate architectural style for a system involves asking relevant questions, for example: • Does the system comprise components operating at various conceptual levels? Architectural styles help in organizing these components systematically.

• Is the primary function of the system centered around processing and managinginformation? Differentarchitecturalstylesmaybemoresuitable for data-centric or computation-centric systems.

• Does the system need to share data or resources with individual applications or services? The choice of architectural style can facilitate or hinder such interactions.

• Does the system consist of components that communicate in dynamic and unpredictable ways, with frequent changes? Some architectural styles are better suited for dynamic systems where component interactions may evolve over time.

Architectural styles are essentially generalizations of design patterns as the guiding principles for the entire system’s architecture. In fact, it is not always clear when a particular design principle becomes a design pattern or an architectural style, especially when a design pattern, such as the Observer pattern, is generalized to become the foundation of an architecture.

Although this distinction usually does not carry significant importance, the fundamental difference lies in the fact that a design pattern often appears in the system as multiple instances solving various local design problems uniformly, while an architectural style dictates the overall structure of the system. In what follows, we will explore the most common architectural styles, their general use cases, and their application in architectural design, using UML for description.

Layered Architecture Architectural styles are often used as aids in understanding the structure of theactualsystem. Therefore, sucharchitecturalstylescanbeunderstoodnot only as an explanation of the structure of the actual implementation but also as a grouping or visualization technique. In particular, layered architecture can be employed in describing almost any system.

Layered architecture consists of levels organized according to some abstraction principle into ascending order. Often, this abstraction principle implies a scale of device-to-human: levels closer to the device are at a lower abstraction level than those closer to humans. The former typically provide primitive functions close to the device or operating system, while the latter encompasses services related to the graphical user interface application area.

In practice, the layers may be so technical that it is difficult to identify abstraction levels. In such cases, the layering principle is resolved by having upper layers utilize services from lower ones. Higher-level services are implemented using lower-level services. Layers can thus be identified (or refined) afterward based on usage relationships.

Layered architecture can also be viewed as a way to see the system organized into parts divided according to usage relationships, composed of components at the same level concerning usage relationships. Thus, layered architecture serves as both a decomposition principle, simplifying system construction, and a grouping principle, facilitating understanding.

The basic idea of layered architecture is that a component or individual service at a certain level is implemented by using components or services provided by a lower layer (see Figure 1). Due to various reasons, deviations from this basic idea are common, and pure layered architecture is quite rare.

There are two types of deviations: a service call can go from a lower layer to an upper one (hierarchy breach), or a service call can bypass layers when going from the top down (bridging). Bypassing layers is often necessary for reasons of efficiency, as a service is often more efficient in lower layers.

Bypassing may also be necessary simply because the service is not directly available immediately from a lower layer.

Bypassing layers is not usually considered a severe departure from layered architecture, although extensive use of it may weaken the idea of layered architecture. On the other hand, a call going from a lower layer to an upper one is a serious issue in layered architecture if it results in the lower layer becoming dependent on the upper one. In some cases, a lower layer needs to

Figure 1: An upper layer calls a lower layer to request services, and the lower layer responds to the requests.

call an upper one. This occurs when the lower layer has to adapt its service to the upper layer’s requirements and therefore must call code included in the upper layer. This is a typical callback situation, and such a call must be implemented using the callback principle to prevent the lower layer from becoming dependent on the upper one. The lower layer provides a registration operation that the upper layer uses to register its code for use by the lower layer.

Describing Layered Architectures Various methods are employed to visualize layered architectures as shown in Figure 2). A popular approach is the ”layer cake” style shown in the figure.

In this visualization, it is also possible to use a circular representation, where the ends of the layer cake are bent together.

Each layer possesses a set of interfaces it implements, and another set of interfaces it depends on. The interfaces needed by the upper layer should match the interfaces provided by the lower layer. When the interfaces offered and required by the layer are clear, the layer’s implementation can be swapped without affecting the rest of the system.

A typical example of a layered architecture is a business system divided into four layers (see Figure 3). At the lowest level is the layer providing

|     | Figure |      | 2: Visualizing |              | layered | architectures. |         | | --- | ------ | ---- | -------------- | ------------ | ------- | -------------- | ------- | |     | Figure | 3: A | layered        | architecture |         | of a business  | system. | general infrastructure support (e.g., data persistence through a database, distribution, etc.). Above that is the layer implementing the application logic and concepts for the application domain. Following that is the layer implementing the logic for individual applications, and at the top is the layer

| implementing      | the | user | interface | for | individual   | applications. |     | | ----------------- | --- | ---- | --------- | --- | ------------ | ------------- | --- | | Multi-Dimensional |     |      | Layered   |     | Architecture |               |     |

Layered architecture is sometimes multi-dimensional in the sense that layering can be conceptualized in more than one direction (see Figure 4). The two-dimensional case is common, especially in the context of various pro-

gramming platforms. In this scenario, the first dimension is typically based on traditional application logic or application domain logic (ranging from the user interface to low-level basic services). The second layer is based on how generic or product-specific the components are (domain-specific, companyspecific, product-specific). Presenting this graphically in a simple way can prove complex, as readers often have preconceptions about the orientation of abstract/concrete layers.

Figure 4: Two dimensions of a multi-dimensional layered architecture.

Pros and Cons of Layered Architecture Layered architecture is a common model that can be applied to systems of various scales, whether small or large. It divides the system into coarsegrainedparts, makingiteasiertocomprehendasawhole, whileallowingeach parttobeunderstoodinisolation. Layeredarchitectureisintuitiveandeasily understood, making it a useful tool for communication when discussing the system with diverse stakeholders, such as marketing, management, and endusers. It guides software design towards minimizing dependencies, as layers ideally only depend on the layers below them. Consequently, this makes the system easier to modify and maintain. Each layer implements its own level of abstraction, allowing specific implementers, testers, and maintainers to specialize.

Layering often serves as the basis for organizational structure, following Conway’s Law: significant layers have dedicated units responsible for them.

Layered architecture also supports software reusability, as new applications can be built on top of lower layers, and applications can be migrated to differentenvironmentsbyre-implementingthelowerabstractionlayerspecific to that environment, such as the operating system.

A common challenge in layered architecture is efficiency loss. When attempting to obtain a required service from the layer immediately below, it may not always be in the most efficient form. Services often need to be passed down through layers, resulting in unnecessarily indirect operations.

If data is passed as a parameter, it may need to be reanalyzed at each level from top to bottom, leading to duplicated work. Sometimes layering can create uncertainty about the proper placement of a component if its role is not clearly associated with any specific layer.

Handling exceptions is another common challenge associated with layered architecture. System operations typically start with a service request originating from the top layer (the user interface), causing a cascading chain of callsdownward. Ifanerrorisdetectedatoneofthelowerlayers, anexception is raised and travels back up the chain until it finds a handler. The problem is that the exception is handled at a higher level than where it originated, potentially making it difficult to address the situation effectively. In extreme cases, an exception originating from the lowest layer can propagate all the way to the system’s end-users, leaving them with a cryptic error message.

Pipes and filters architecture Pipes and filters architecture consists of processing units, filters, and the connecting channels, pipes, that carry data. These filters have roles in active data processing and passive data transport. Each processing unit operates independently, reading its own input stream and producing its own output stream. By connecting the output stream of one filter to the input stream of the next, aggregated data stream processing is achieved. The architecture is illustrated in Figure 5. The most evident example of applying this architectural style is the Unix system’s ability to transfer the results of processes as inputs to subsequent processes using pipes, but this style also has other applications.

Applying pipes and filters architecture requires that each processing unit can be implemented as an independent unit, reading its own input and producing its own output, without relying on other units. These units should

Figure 5: The pipes and filters architecture.

not share state information and do not need to be aware of each other; they depend solely on the format of their own input. In addition, the processing should occur in a single stage, meaning that the processing of a specific data element should not depend on the processing of a future data element. If it does, it is theoretically possible to handle this by creating an internal buffer within the unit, where the data flow is read until the expected data element is obtained, after which the data flow is read from the buffer. However, such an arrangement breaks the basic idea of the architecture, making sensible parallelization of processing units more difficult.

The simplest and most common form of pipes and filters architecture is the pipeline architecture, where the data stream progresses without branching along a chain of processing units. In this case, data transmission can be implemented synchronously in two ways, either by pushing or pulling the data.

In the push option, the original data producer first calls the first processing unit, passing the first data item as a parameter. The unit produces its own output item based on that and passes it as a parameter to the next unit.

Finally, the last unit calls the ultimate user of the data stream with the last unit’s produced data item as a parameter. This is repeated until the entire data stream has been processed.

In the pull option, the ultimate user of the data stream first requests a result item from the last processing unit. This unit then requests it from the previous unit, and so on, until the first unit requests the first data item from the data source. The source provides it and, based on that, produces its own output item and returns it to the previous unit, and so on until the last unit is finally able to return its output item to the user of the data stream. This is repeated until the entire data stream has been processed.

An example of the pipes and filters architecture is an image processing program. This architecture facilitates a series of steps applied to the original picture. The original image serves as the starting point, and various filters or operations are sequentially added to enhance or modify it. These filters can be easily removed or exchanged, leading to immediate changes in the image.

Additionally, this architecture allows for efficient conversion of the processed image for different purposes, such as web publishing or paper printing. It also provides the capability to apply the same operations uniformly to an entire picture library, ensuring consistency across multiple images.

Concurrent Units and Buffering The pipes and filters architecture provides a straightforward way to parallelizeasystem. Eachprocessingunitcan,intheory,operateasitsownprocess in parallel with others. This can be useful for understanding the structure of computations, enhancing system performance, or simply because processing units are working on different machines connected over a network.

Figure 6: Buffering between filters.

To enhance the parallelism of a parallelized pipes and filters architecture, data channels are typically implemented with the help of buffers (see Figure 6). This allows processing units operating sequentially to not have to synchronize their processing of data elements. Buffers can be either limited or unlimited in size. An unlimited buffer can lead to substantial memory requirements if the data stream being processed consists of space-consuming data items. On the other hand, a highly restricted buffer might reduce the degree of parallelism as processes often need to wait. The appropriate buffer size is usually determined through experimentation.

If processing units operate at roughly the same speed, parallelization should ideally lead to the entire system working in the same amount of time as a single processing unit. In practice, this is often not achieved. Buffers are typically structured as a queue (FIFO), but conceptually more complex

structures such as trees can also be used. The key is that the next unit should be able to identify newly produced, unprocessed parts in the buffer.

Pros and Cons of Pipes and Filters Architecture The most significant advantage of pipes and filters architecture is the ability to perform complex data processing incrementally, by refining data one step at a time. This enables the controlled understanding and implementation of many data processing tasks that would otherwise be very challenging to accomplish in one step.

Another crucial advantage is the variability enabled by the pipes and filters architecture. Processing units can be combined in various ways, with the essential condition being that the units understand their own input data stream. It is easy to replace a specific unit with another, as long as the new unit can recognize the same data stream. The architecture also provides a natural way to parallelize a system.

Pipes and filters architecture is not suitable for interactive systems, nor was it intended for such purposes. A system based on this architecture does nothaveaglobalstatethatwouldbemeaningfulforuserinteraction. Sharing globalinformationamongprocessingunitsisnotinlinewiththefundamental concept of pipes and filters architecture.

Datatransmissionbetweenunitscansometimesleadtounnecessarywork.

If the representation of data in the channels needs to be maintained at a relatively high level (for instance, due to compatibility reasons), units are repeatedly required to generate and then analyze high-level data representations. For example, if it is agreed for standardization reasons that data should be transmitted in XML format, units may have to repeatedly generate and analyze XML data, potentially causing efficiency issues.

Error handling can be a challenge in this architecture, somewhat similar tothechallengesfoundinlayeredarchitecture. Ifthereisadesireforprocessing units to recover from errors in the data stream and continue processing the data afterward, specific error recovery techniques are required. These techniques can be based on defining ”safe” data items in the stream. When an error is detected in the data stream, a processing unit skips data items until a safe data item is reached, after which normal processing is assumed to continue.

Client-Server Architecture The client-server architecture is currently perhaps the most commonly used architectural solution. The basic idea is to encapsulate the management of a specific architectural level resource (server) in such a way that the resource’s users (clients) do not need to worry about technical issues related to resource usage such as exclusion, but they can request a specific resource-related service from the server independently of other clients (see Figure 7). Therefore, the client-server architecture can be considered as an architectural-level solution that is similar to the object-oriented paradigm.

Figure 7: Client-server architecture.

In a more general sense, the client-server architecture is a service-oriented architecture. Service-oriented architectural styles are designed to have two roles: service providers and their users. However, these roles are generally not strict, as a service provider for one service may also act as a user for another service. Often, the idea behind a service is based on some resource, the services of which a software component built around it can provide to its environment.

In a client-server architecture, interaction between the client and server typicallyoccurswithinthecontextofasession: duringasession,ameaningful

set of services is provided to the client. Servers usually remain passive until a client contacts them. Once the client has completed its task, it terminates the session. Sessions can include transactions, and the server is responsible for ensuring their integrity and rollback as needed.

Communication between the client and server is typically more strictly regulated than between individual objects. Additionally, the server always operates in its own thread or process, keeping its implementation separate from clients. If the server’s load becomes too high and starts to slow down application performance, its internal implementation can be made multithreaded or use multiprocessing to increase capacity.

Pros and Cons of Client-Server Architecture The primary advantage of the client-server architecture is a clear division of labor, which can serve as the foundation for distribution as well. However, in this context, some idle time can easily occur because, for example, remote method calls are considerably slower operations than local procedure calls. When examining distributed systems, it becomes apparent that many systems that make use of data storage are based on the client-server architecture. In this scenario, the server manages the use of the data store, and access is only possible through the server. With a centralized server in place, it is easier to enforce security policies, access control, and data protection.

The reason for making systems distributed is that clients and servers are typically designed to be independent of each other, with the assumption that they will be running in different processes (or processors). Consequently, the use of this design paradigm leads to solutions where issues of clients and servers can be isolated in such a way that, for example, if one client behaves erroneously, the server can still serve other clients. Similarly, if the server crashes, a client can continue its operations without disruption, assuming it can do something other than communicate with the server. Additionally, excluding clients is straightforward.

Client-serverarchitecturefacilitatesmaintenanceandadaptability. When changes or updates are needed, it is often easier to make modifications on the server side, which then propagates to all connected clients. This centralization of updates streamlines the maintenance process and ensures that all clients are using the latest version of the service or application. Moreover, client-serverarchitecturehasawealthoftechnologicalsupport. Various tools, libraries, and development frameworks are available to build and man-

age client-server applications. This well-established architecture has a rich ecosystem that simplifies development, integration, and scalability.

One of the significant drawbacks of client-server architecture is the potential for performance issues caused by network traffic. Since clients interact with the server over a network, the latency and bandwidth constraints of the network can affect the overall system performance. High network usage, especially in large-scale deployments, can lead to delays and decreased responsiveness. Today, however, cloud computing has significantly transformed the landscape of client-server architecture, addressing many of the performance issues associated with traditional client-server setups.

The architecture is inherently server-centric, meaning the system’s stability and availability rely heavily on the server. If the server experiences a failure or becomes overloaded, it can disrupt the entire system, affecting all connected clients. This central point of failure can be a critical issue, and redundancy measures are often needed to address it. Finally, handling exceptions and errors in a client-server architecture can be complex. Error handling and recovery mechanisms must be carefully designed to ensure that if a client or server experiences an issue, the system can gracefully recover or failover to alternative resources. Inconsistent error handling across clients and servers can lead to unpredictability and potentially critical issues.

Microservices Microservices areavariantofservice-orientedarchitecture,wherefine-grained services are connected using lightweight protocols. This approach enhances modularity, making it easier to understand, develop, and test. The philosophy behind microservices is to ”do one thing and do it well.” Figure 8 illustrates the transition from monolithic architecture to microservices.

In the realm of microservices, there is no universally agreed-upon definition, leading to varying interpretations. However, common properties often associated with microservices include the use of processes that communicate through straightforward protocols like HTTP, though alternative communication methods, like shared memory, are feasible. These services can run within the same process or independently, are designed for seamless deployment and replacement. Microservices can be implemented using diverse programming languages and technologies. They are typically small, decentralized, and frequently created and launched through automated processes.

Figure 8: Monolithic and microservice architectures.

Pros and Cons of Microservices Microservices offer several advantages in modern software development. Microservices naturally enforce a modular architectural approach. Each service is designed to perform a specific task or function, which fosters clean and isolated development. This modularity makes it easier to manage and maintain different parts of a complex application. Microservices also align well with modern continuous software development processes, such as Continuous

Integration and Continuous Deployment (CI/CD). This means that new features or updates can be developed, tested, and deployed independently for each microservice, allowing for faster iteration and more frequent releases.

Microservices provide characteristics that are highly beneficial for scalability. Since each service operates independently, it is easier to scale individual components to meet changing demands. This fine-grained scalability enhances the efficiency and cost-effectiveness of resource allocation.

Microservices, while advantageous in many respects, also present some challenges and potential drawbacks. In a microservices architecture, services operate independently, which can lead to information barriers. Sharing data or maintaining consistency across services can be complex and might require additional effort to manage. Moreover, inter-service communication over a network typically incurs higher latency and message processing time compared to in-process calls within a monolithic service. This can affect system performance, especially in scenarios with high network traffic.

Testing and deploying microservices can be more intricate than monolithic applications. Coordinating the testing and deployment of numerous independent services, each with its own version, can be a significant opera-

tional challenge.

Moving responsibilities between microservices can be challenging. Deciding which service should handle a specific task or function and ensuring a smooth transition of responsibility can be a non-trivial process. Finally, the risk of creating too many microservices is also a potential drawback. While granularity can be beneficial, over-segmentation can lead to excessive complexity, makingthearchitecturehardertomanage. Strikingtherightbalance between granularity and simplicity is essential.

Peer-to-Peer (P2 P) Architecture Peer-to-Peer (P2 P) architecture, often referred to as a P2 P network, represents a departure from the traditional client-server model (see Figure 9).

In P2 P, clients, often referred to as peers, are not just consumers but also providers, serving as both clients and servers. This dual role enables resource sharing, encompassing resources such as information, computing power, and channel bandwidth. Error-sensitivity (compared to servers in client-server architectures) tends to decrease in P2 P architectures due to the distributed nature and resource sharing. Furthermore, hybrid models can combine centralized servers with P2 P connections between clients, offering a versatile approach to network architecture. Figure 10 shows a comparison between client-server and P2 P architectures.

Figure 9: Peer-to-peer architecture.

P2 P architecture is comprised of numerous autonomous peers, creating a self-organizing system. Its primary purpose is to harness distributed resources while sidestepping the need for centralized services. P2 P networks

Figure 10: Comparing client-server and P2P architecture.

are occasionally employed to obscure the originator or ”culprit” of data or actions. For example, peer-driven nature of P2 P networks can make it more challenging to trace and identify those responsible for unauthorized sharing or distribution of copyrighted materials.

P2 P represents more than just file sharing, however. It can be considered a novel paradigm for distributed systems. Within this framework, coordination transforms into cooperation, and centralized systems shift toward decentralization. Active participation in P2 P networks provides incentives for users, contributing to their unique appeal. For instance, in some P2 P networks, users can share their computer resources, such as processing power or storage space, in exchange for access to resources from other participants.

P2 P networks align with three essential requisites for the future of Internet systems: scalability, security, and reliability, along with flexibility and quality of service. In contrast, client-server architecture exhibits potential issues, such as centralized server and network traffic acting as bottlenecks and susceptibility to server-based attacks.

P2 Ptechnologyfinds applicationsacross various domains. P2 P facilitates storage capacity and file distribution systems like torrents. It also enables distributed computing power, as seen in technologies such as Bitcoin. P2 P networks are sometimes employed in botnets. Moreover, it serves as a foun-

dation for devices and machines to communicate directly with each other.

Pros and Cons of P2 P Architecture P2 P networks have many advantages, such as exhibiting strong fault tolerance. The decentralized nature ensures that if one peer fails, the network can still function by relying on other peers. Sharing of bandwidth and resources inaP2 Pnetworkcanleadtosignificantcostsavings, asitdistributestheload among participants. Furthermore, P2 P systems are inherently scalable. As more peers join the network, it becomes more robust and capable of handling increased traffic and demand.

Security can be a concern in P2 P networks, especially for file sharing, where there is a risk of malware. P2 P networks may sometimes struggle to offer consistent service levels, especially when many peers are involved.

Lastly, hybrid models that combine centralized and P2 P elements can be complex to design and manage, adding to the intricacies of P2 P architecture.

Message-passing architecture Let us assume that we are designing a system with a group of interacting components. However, there is no precise information in advance regarding the number and quality of these components, nor is there clarity about the type of data these components will handle. In such cases, designing a system based on fixed, static interfaces can be challenging and risky because it may be difficult to precisely define all the considerations before development begins. In this case, a message-passing architecture is a suitable solution.

The fundamental idea of a message-passing architecture (also known as Message dispatcher architecture, or Message bus architecture) is an architectural approach where a group of components communicates with each other through a centralized message dispatcher or bus. The key difference from the client-server architecture is that roles are not fixed in a message-passing architecture.

In a message-passing architecture, components share a common interface that includes the necessary operations for receiving messages. Each message carries information that instructs a component on what it should do. In a sense, this implies a dynamic interface: the content of a new type of message

does not alter the static structure of the system, but a new component can process it, bringing essential new functionality to the system.

Implementation can be achieved, for example, by having components register with the dispatcher (also known as message broker), indicating their interest in specific types of messages. The dispatcher, in turn, delivers messages to the components as they are sent, or by using configuration files that determine message routing. Sometimes, different queues or mailboxes are employed. The operation is illustrated in Figure 11.

Figure 11: Peer-to-peer architecture.

Defining the structure, contents, error handling, and other attributes of messages in a message passing system is crucial for effective communication and system reliability. Typically, there are several different types of messages in a message passing architecture. Event messages notify other components of specific occurrences or changes without expecting a direct response.

Request-answer messages involve a two-step process where a sender makes a request, and the receiver responds with an answer, commonly used in clientserver interactions. Command messages are used to trigger specific actions or procedures on remote systems or components, often without immediate response. Data messages are used to transmit structured information or data between components or systems, facilitating information exchange.

The defining characteristics of a message-passing architecture are as follows:

• A group of communicating components.

• Messages through which components communicate without the sender knowing the message’s destination or the receiver’s source.

• Operations by which components respond to messages.

• Rules for components and messages to register with the system.

• Rules for the dispatcher to determine which component a message should be sent to.

• Concurrency model: the degree to which components and the dispatcher work concurrently.

Message-passing architectures have become more prevalent in various software domains. This reflects the growing need in software development to accommodate unknown requirements and the demand for easy scalability.

Often, this means avoiding strong adherence to tightly defined static interfaces. In this context, message-passing architecture provides an appealing alternative. It relies on a simple basic structure, where static interfaces are based on fundamental principles such as components receiving messages and the message dispatcher sending and registering messages. Functionality is built upon these fundamental principles, with messages triggering actions in different components.

When applying message-passing architecture to the object-oriented programming paradigm, the actual message passing may sometimes be hidden from the programmer. This means that communication can manifest as interfaces that programmers need to implement, using methods such as plugin modules or predefined inheritance hierarchies. This is common, especially in application development, where the framework handles the actual message passing, but allows programmers to add new functions for specific events.

This approach is quite typical in graphical user interface development. However, challenges can arise in this approach, as it is not always clear when to use direct method calls and when to employ message passing. This is because message passing can be encapsulated deep within the application framework, making it difficult for programmers to understand what is happening behind the scenes.

Examplesofmessagepassingarchitecturesincludeenginecontrolsystems, IoT systems, multimodal systems (command-centric architectures), business

management systems within a company, and, more broadly, distributed systems and loosely coupled systems.

Pros and cons of Message-Passing Architecture Message-passing architecture allows for the easy addition of new and different components without making static changes to the system, even during runtime. The architecture is also very fault-tolerant: components can be removed during runtime without causing the system to crash, even if some messages are no longer accepted. The system’s configuration becomes highly flexible and dynamically formed. The architecture supports both synchronous and asynchronous message passing and concurrency.

One potential drawback of this architecture is the potential inefficiency resulting from message composition and interpretation. Maintaining the system can also be more challenging than in systems with static interfaces because understanding the system requires grasping not only static interfaces but also the runtime structure and content of messages. In fact, it can be argued that the runtime structure and content of messages create a new, higher-level architecture in terms of abstraction.

A downside of this style is the flexibility it brings, which places a greater responsibility on designers, especially in terms of the volume of messages being exchanged. In some situations, issues can arise due to the roles associated with components, as these roles may not always be respected when implementing new features in a hurry.

Model-View-Controller Architecture ThefundamentalideabehindtheModel-View-Controller (MVC) architecture is to separate the user interface from the actual application logic and data.

The goal is to make it easy to modify the user interface and to move the system to another graphical platform. Additionally, it aims to ensure that theuserinterfacealwaysreflectsthestateoftheapplicationdataanddisplays it consistently and in the correct format in various views as needed.

The model of the Model-View-Controller architecture presented here follows the form introduced by Buschmann et al. in 1996, with slight variations of the model. The system is divided into three types of components: models, representing some part of application data or the logical state of the

application; views, representing some part of the visible user interface; and controllers, acting as adapters between models and views, ensuring that they correspond to each other. This architecture makes use of the Observer design pattern: views and controllers implement an observer interface, which allows them to register as observers for certain model(s) to monitor their changes.

When changes occur, views and controllers can request the modified data from the model.

The responsibility of a model object is to manage application data and provide logical application operations that modify this data. The model offers operations through which interested parties can subscribe to monitor its changes, and it notifies them when changes have occurred. The view ensures that the display is updated to reflect the model’s state. Naturally, multiple different views can be associated with the same model depending on the application. The controller receives user commands and translates them into logical application functions.

The typical interaction begins with a user command, which is detected by the the controller (Figure 12). It requests the model to execute the corresponding logical application service. As a result, the model’s state changes, which it then informs interested views and controllers about. The view calls its screen update operation, which first queries the model for changed information. Afterward, the display can be updated. Similarly, the controller queries for changed information and may adjust its own state accordingly.

For instance, a command may be allowed or denied based on this, and the controller needs to be aware of it.

Pros and Cons of Model-View-Controller Architecture The Model-View-Controller architecture allows for the reuse of the model in almost all situations. This is why it is a natural choice as a mechanism for implementing graphical user interfaces. In fact, nearly all such environments, in one way or another, guide the user towards an architecture following the

MVC model.

MVC architecture is highly versatile as it allows the developer to implement several different views for the same set of data. One of the key benefits of MVC is automatic synchronization. When the data in the model changes, all associated views are updated accordingly. This ensures that the user always sees the most up-to-date information, no matter which view they are using.

100

Figure 12: Typical interaction in the MVC architecture.

MVC architecture makes it relatively easy to add new views to a running system. This scalability is essential in dynamic applications where new features or display modes need to be introduced over time. Without disrupting the existing functionality, one can extend the application by simply creating a new view that interacts with the same underlying model.

The separation of concerns in MVC allows for greater flexibility in changing the layout and presentation of the user interface. When one needs to modify the appearance or organization of the user interface, one can focus on the view and controller components without altering the underlying application logic in the model. This separation of responsibilities simplifies maintenance and updates, making the architecture adaptable to evolving design and usability requirements.

The Model-View-Controller architecture also comes with certain issues.

It typically complicates the system by adding more classes. To prevent excessive fragmentation of the system, it is advisable to assign controller and view classes only to larger user interface components, such as dialogues. Applying the Observer pattern potentially results in a lot of update calls to observers, not all of which may need to react to the change at all. This becomes problematic, especially when different components are distributed across different processes.

Another problem with this architectural style is that view and controller 101

classes are closely related, and it is challenging to reuse them independently in other contexts. In some versions of MVC, view and observer classes are combined. Requesting changed data can be a potential source of inefficiency: each observer must query the model for changed data using generic model operations, which can be slow. Moreover, different observers may have to make the same or similar queries after a change.

In practice, the choice of how to apply the Model-View-Controller architecture is often dictated by the GUI framework in use. Such frameworks are almost always based on some variant of the Model-View-Controller architecture, but it is also possible that the framework and its supporting tools hide this architecture from the application programmer.

Interpreter Architecture Frequently, there is a need to provide functional descriptions as input to a system. For instance, the system may offer a set of fundamental services, but it is only during runtime that the appropriate way to combine them becomes evident. Alternatively, onemayencounterasituationinaspecificapplication domain where a unique, abstract method is used to describe functionality.

In such cases, the aim is to enable applications to function across various platforms capable of executing these abstract functional descriptions. This often leads to the adoption of an interpreter architecture.

The basic idea of an interpreter architecture is that an interpreter reads and executes a functional description in a certain known form, using the services of a particular execution platform. The latter could be, for example, a support software created for a specific application domain, which the interpreter relies on. An example of using interpreter architecture for portable abstract functional descriptions is a SQL-supporting database management system. It allows the creation of applications that are easily transferable from one database system to another.

In some cases, the execution platform can be the implementation language itself, eliminating the need for a separate execution platform. The representation to be interpreted is produced by some entity (e.g., a human or another system), which is not relevant in this context. The representation to be interpreted does not have to be textual language; it can be in table form (e.g., different rule-based systems) or even a state machine. A typical example of an interpreter architecture is a system that supports scripting, 102

where the system user can write their own functional descriptions and execute them within the system immediately. Often, XML is used to represent functional descriptions. Also, programming systems based on virtual machines (e.g., Java) can be considered applications of interpreter architecture.

An example of interpreting the Java programming language is illustrated in Figure 13.

Figure 13: Java as an example of an interpreter architecture.

Pros and Cons of Interpreter Architecture The interpreter architecture creates a runtime data structure from the executable code, which is entirely under the system’s control. Consequently, it can be examined and modified arbitrarily during execution. This achieves reflexivity without any support from the actual implementation language.

The language to be interpreted can be easily changed, especially if the Interpreter design pattern has been used. Expanding the language does not render old functional descriptions written in that language unusable; instead, changing the implementation or removing classes that correspond to structures can make them incompatible. If only the language interpretation needs to be changed, but not its structure, it is sufficient to modify the implementation of the interpretation operation. This can be done, for example, by

103

subclassing, and generally, there is no need to touch the existing code. This way, it is relatively easy to switch the underlying execution platform, for example.

The downside of interpreter architecture is the degradation in execution efficiency compared to native code execution. This can be due to both creating the interpreted representation and the indirect, interpreting execution.

Typically, non-native execution is at least an order of magnitude slower than nativeexecution, andsometimesitcanbeseveralordersofmagnitudeslower.

The space requirement for the executable object representation can also be substantial; it may take up significantly more space than an equivalent string representation or machine code. However, this is not necessarily the case, as, for example, Java bytecode is much more compact than equivalent pure machine code.

A program implemented in an interpreter-based system can naturally have its own structure, which can further follow a certain architectural style.

Building more complex systems is also possible. For example, one can think of a layered architecture where each layer offers its own interpreted language, and the language’s abstraction level increases as one moves from one layer to another.

104
