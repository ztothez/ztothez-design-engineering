---

title: ATAM

source: ATAM.pdf

converted: 2026-08-25

---

Software Design and Architecture 2018 ATAM evaluation Sampsa Rauti and Tampere University of Technology Basic concepts of ATAM • Scenario: a test case of an architecture • Utility tree: refining the quality requirements of the target systems towards scenarios.

• Sensitivity point: changes on this architecture decision may cause significant changes to and quality property.

• Trade-off point: architecture decision that affects several quality property in different directions • Risk: architecture decision that may cause future problems from quality attribute’s view • Non-risk: architecture decision that may help fulfilling a quality property.

Phases of ATAM (2 days) 1. Present the ATAM 2. Present Business Drivers 3. Present Architecture 4. Identify Architectural Decisions 5. Generate Quality Attribute Utility Tree 6. Analyze Architectural Decisions

7. Brainstorm and Prioritize Scenarios 8. Analyze Architectural Decisions 9. Present Results Participants Scenarios • Scenario makes quality requirement concrete using an example. An event or sequence of events that is in connection with a quality requirement.

• Scenario is precise (test case, use case).

• Structure of a scenario: Stimulus – environment – response.

• Use case scenario: user’s interaction with the system.

• Remote user fetches database report using web interface during the peak load and gets the report in 5 s.

• Evolving scenario: anticipated changes • New data server is added to the system to decrease latency by 2.5s, the work is done in 1 person-week.

• Explorative scenario: unexpected changes, loads, etc.

• Half of the servers crash during normal operating conditions; this does not affect the availability of the system.

• Default environment: normal operating conditions.

Scenario example Utility tree A documented scenario The most important results of ATAM • • Identifying the key architecture approaches.

Identifying the most essential use and development scenarios.

• The quality attribute utility tree and scenarios: description of connection between quality requirements and architecture approaches.

Identifying the risks of the architecture.

• Potential problems and benefits in ATAM • Time and money • Big question: are the scenarios really sensible or useful, can the essential scenarios be selected (forecasting) • Found risks vs. hidden ones

• Prioritizing: are the right scenarios selected?

• A definite benefit: collect together all stakeholders of the software • Silent knowledge can be documented • A general understanding of the system is obtained • Worries and problems of different stakeholders become known, and most critical issues can be taken care of

Conclusions • Scenario-based evaluation method • Finding architectural decisions and documenting them.

• Connecting quality properties to architecture decisions.

• More about ATAM: • http://www.sei.cmu.edu/architecture/tools/evaluate/atam.cfm • http://www.sei.cmu.edu/reports/00tr004.pdf
