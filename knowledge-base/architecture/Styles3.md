---

title: Styles3

source: Styles3.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 Architectural styles, part 3 Sampsa Rauti and Tampere University of Technology Architectural styles • Partitioning architectural styles • Layer / tier architectures (partition by structure)

• Pipers and filters architecture (partition by functionality) • Service-based architectural styles • Client-server architectures • Peer-to-peer • Message-passing architectures (publish-subscribe) • Special architectures

• MVC architectures • Interpreter architectures MVC • Architectural solution for interactive systems separating the user interface from the application logic.

• Starting points: • There should be possibility to offer different kinds of views from the state of the application.

• The user interface should immediately reflect the changes of the application state.

• The user interface should be easy to change • It should be able to transfer the application to another graphical platform.

Responsibilities • Model • Offers logical functions and information of the application • Registers viewing components interested in the state of the application • Informs state changes to registered components

• View • Takes care of displaying the state on the display • Controller • Reads user commands • Changes the command to application functions MVC interaction Pros and cons of MVC • Pros • Easy to implement several views to the same data

• All views are automatically synchronized • New views can be added to a running system • The layout of the interface can be changed with relative ease • Cons • Possibly unnecessary requests to update the view

• Metadata inquiries may increase execution time • For simple applications a lot of extra work Interpreter architecture • The need to give functional descriptions as input to the system. Examples: • Need to combine primitive functions in different ways that are not known in advance.

• Need to separate a logical, abstract execution platform from concrete one (e.g. to make it easier to change the latter one) Example: Java Example: Modifiable games Modifying games and extensions • Skyrim: http://www.creationkit.com/Main_Page

• Tools for creating maps, persons, stories, etc.

• Papyrus scripts • Also Fallout 3 / New Vegas, Oblivion • Medieval Total War 2: http://medieval2.heavengames.com/m2tw/mod_portal/tutorials/i ndex.shtml • Definition of troops and building by text files.

• Civilization 5: http://modiki.civfanatics.com/index.php/Main_Page • XML, Lua scripts Conclusion • Architectural style = A common model telling how the system is organized on the highest abstraction layer. Defines the general technical nature of the system.

• There can be several architectural styles in one architecture and they can overlap with each other • The chosen framework often enforces some specific architectural style • Architecture ~ domain know-how + technical know-how

• Technical know-how ~ architectural styles, patterns, general good practices
