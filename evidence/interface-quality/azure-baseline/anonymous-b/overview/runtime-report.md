# ZtotheZ Design Engineering Runtime Verification

- URL: `http://127.0.0.1:3102/`
- Browser: Chromium 151.0.7922.108
- Result: FAIL
- Findings: 10 errors, 8 warnings, 0 info
- Screenshots: 8
- Journeys: 0/1 passed
- Expected network policies: 0/0 satisfied
- Evidence directory: `/home/ztothez/Studio/experiments/UIX-Design-Skill/evidence/interface-quality/azure-baseline/anonymous-b/overview`

## Findings

### WARNING ZTDE-RUNTIME-012 (custom-375x812)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### ERROR ZTDE-RUNTIME-015 (custom-375x812)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `div.font-mono`

- Document exceeds the viewport by 80px after text resizing.
- First non-scroll-contained offender: div.font-mono.
- Root 455px/375px; body 455px/375px.
- Furthest rendered edge: div.rounded-md at 455px.

### ERROR ZTDE-RUNTIME-016 (custom-375x812)

Transform or positional animation remains active with reduced motion enabled.

Selector: `button.inline-flex`

- Animation duration is 150ms and properties include offset.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### ERROR ZTDE-RUNTIME-002 (custom-768x1024)

Uncaught page error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:00Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:54:59Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...


- Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:00Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:54:59Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...

    at throwOnHydrationMismatch (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:2966:51)
    at prepareToHydrateHostInstance (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:3019:18)
    at completeWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:6330:46)
    at runWithFiberInDEV (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:850:66)
    at completeUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8490:15)
    at performUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8429:23)
    at workLoopConcurrentByScheduler (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8423:55)
    at renderRootConcurrent (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8406:64)
    at performWorkOnRoot (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:7955:145)
    at performWorkOnRootViaSchedulerTask (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:9057:4)

### WARNING ZTDE-RUNTIME-012 (custom-768x1024)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### ERROR ZTDE-RUNTIME-002 (custom-1024x768)

Uncaught page error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:02Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:01Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...


- Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:02Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:01Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...

    at throwOnHydrationMismatch (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:2966:51)
    at prepareToHydrateHostInstance (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:3019:18)
    at completeWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:6330:46)
    at runWithFiberInDEV (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:850:66)
    at completeUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8490:15)
    at performUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8429:23)
    at workLoopConcurrentByScheduler (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8423:55)
    at renderRootConcurrent (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8406:64)
    at performWorkOnRoot (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:7955:145)
    at performWorkOnRootViaSchedulerTask (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:9057:4)

### WARNING ZTDE-RUNTIME-012 (custom-1024x768)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### ERROR ZTDE-RUNTIME-016 (custom-1024x768)

Transform or positional animation remains active with reduced motion enabled.

Selector: `button.inline-flex`

- Animation duration is 150ms and properties include offset.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### ERROR ZTDE-RUNTIME-002 (custom-1440x1000)

Uncaught page error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:04Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:03Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...


- Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:04Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:03Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...

    at throwOnHydrationMismatch (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:2966:51)
    at prepareToHydrateHostInstance (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:3019:18)
    at completeWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:6330:46)
    at runWithFiberInDEV (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:850:66)
    at completeUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8490:15)
    at performUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8429:23)
    at workLoopConcurrentByScheduler (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8423:55)
    at renderRootConcurrent (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8406:64)
    at performWorkOnRoot (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:7955:145)
    at performWorkOnRootViaSchedulerTask (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:9057:4)

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### ERROR ZTDE-RUNTIME-002 (journey:overview-integrity)

Uncaught page error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:06Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:05Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...


- Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SafeFragment>
      <SafeFragment fallback={null}>
        <SafeFragment getResetKey={function getResetKey} errorComponent={function ErrorComponent} ...>
          <SafeFragment fallback={function fallback}>
            <MatchInnerImpl matchId="//">
              <Lazy>
                <Dashboard>
                  <div className="min-h-scre..." data-tsd-source="/src/route...">
                    <div>
                    <main className="mx-auto ma..." data-tsd-source="/src/route...">
                      <section>
                      <section>
                      <section>
                      <section>
                      <AuditConsole data-tsd-source="/src/route...">
                        <section className="space-y-4" data-tsd-source="/src/compo...">
                          <div>
                          <div>
                          <div className="grid gap-4..." data-tsd-source="/src/compo...">
                            <div className="flex h-[36..." data-tsd-source="/src/compo...">
                              <div>
                              <div className="flex-1 spa..." data-tsd-source="/src/compo...">
                                <div
                                  className="text-muted-foreground"
                                  data-tsd-source="/src/components/optimizer/AuditConsole.tsx:96:15"
                                >
+                                 14:55:06Z [SYSTEM] Console ready. Demo dataset loaded.
-                                 14:55:05Z [SYSTEM] Console ready. Demo dataset loaded.
                            ...
                      ...
                    ...
      ...

    at throwOnHydrationMismatch (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:2966:51)
    at prepareToHydrateHostInstance (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:3019:18)
    at completeWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:6330:46)
    at runWithFiberInDEV (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:850:66)
    at completeUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8490:15)
    at performUnitOfWork (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8429:23)
    at workLoopConcurrentByScheduler (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8423:55)
    at renderRootConcurrent (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:8406:64)
    at performWorkOnRoot (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:7955:145)
    at performWorkOnRootViaSchedulerTask (http://127.0.0.1:3102/node_modules/.vite/deps/react-dom_client.js?v=baa785f0:9057:4)

### ERROR ZTDE-RUNTIME-008 (journey:overview-integrity)

Journey failed at step 2 (expectText).

Selector: `body`

- Expected text "Potential Savings"

### WARNING ZTDE-RUNTIME-012 (custom-375x812, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### ERROR ZTDE-RUNTIME-015 (custom-375x812, journey:overview-integrity)

Text-only resizing to 200% creates page-level horizontal overflow.

Selector: `div.font-mono`

- Document exceeds the viewport by 80px after text resizing.
- First non-scroll-contained offender: div.font-mono.
- Root 455px/375px; body 455px/375px.
- Furthest rendered edge: div.rounded-md at 455px.

### ERROR ZTDE-RUNTIME-016 (custom-375x812, journey:overview-integrity)

Transform or positional animation remains active with reduced motion enabled.

Selector: `button.inline-flex`

- Animation duration is 145ms and properties include offset.
- Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.

### WARNING ZTDE-RUNTIME-012 (custom-768x1024, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1024x768, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.

### WARNING ZTDE-RUNTIME-012 (custom-1440x1000, journey:overview-integrity)

Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.

Selector: `button`

- Effective target size is 141px by 36px.
