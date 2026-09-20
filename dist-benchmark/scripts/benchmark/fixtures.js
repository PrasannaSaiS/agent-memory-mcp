/**
 * Scripted deterministic failure scenarios for Phase 8.
 * Each fixture has a known failure, known fix, and a correct resolution label.
 * Deterministic — no LLM calls. The "agent" is simulated by the memory retrieval system.
 *
 * Six scenario types per Phase 8 spec:
 *   1. dependency-mismatch
 *   2. typescript-compile-error
 *   3. missing-env-var
 *   4. port-collision
 *   5. test-assertion
 *   6. platform-path
 */
export const SCENARIOS = [
    {
        id: 'dep-mismatch-01',
        type: 'dependency-mismatch',
        command: 'npm test',
        exitCode: 1,
        output: `
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! peer react@">=16.8.0 <18.0.0" from @testing-library/react@13.4.0
npm ERR! node_modules/@testing-library/react
npm ERR! Conflicting peer dependency: react@18.2.0
    `.trim(),
        knownFixCommands: ['npm install --legacy-peer-deps'],
        knownFixExplanation: 'React 18 peer conflict in @testing-library/react requires --legacy-peer-deps flag.',
    },
    {
        id: 'dep-mismatch-02',
        type: 'dependency-mismatch',
        command: 'npm install',
        exitCode: 1,
        output: `
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! peer eslint@"^7.0.0" from eslint-config-prettier@8.10.0
npm ERR! Conflicting peer dependency: eslint@9.0.0
    `.trim(),
        knownFixCommands: ['npm install eslint@8 --save-dev'],
        knownFixExplanation: 'eslint-config-prettier@8 requires eslint@7. Downgrade eslint to v8 for compatibility.',
    },
    {
        id: 'ts-compile-01',
        type: 'typescript-compile-error',
        command: 'tsc --noEmit',
        exitCode: 2,
        output: `
src/server.ts(42,5): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/server.ts(67,3): error TS2322: Type 'number' is not assignable to type 'string'.
    `.trim(),
        knownFixCommands: ['tsc --noEmit --strict false'],
        knownFixExplanation: 'Strict null checks reject undefined. Add explicit null checks or use the non-null assertion operator.',
    },
    {
        id: 'ts-compile-02',
        type: 'typescript-compile-error',
        command: 'npm run build',
        exitCode: 2,
        output: `
src/utils.ts(12,1): error TS2304: Cannot find name 'process'.
src/utils.ts(15,1): error TS2304: Cannot find name 'Buffer'.
error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
    `.trim(),
        knownFixCommands: ['npm install --save-dev @types/node'],
        knownFixExplanation: 'Missing @types/node. Install it to get Node.js global type definitions.',
    },
    {
        id: 'missing-env-01',
        type: 'missing-env-var',
        command: 'node dist/server.js',
        exitCode: 1,
        output: `
Error: DATABASE_URL environment variable is not set
    at validateEnv (/app/src/config.ts:14:11)
    at Object.<anonymous> (/app/dist/server.js:3:1)
    `.trim(),
        knownFixCommands: ['cp .env.example .env'],
        knownFixExplanation: 'DATABASE_URL not set. Copy .env.example to .env and fill in credentials.',
    },
    {
        id: 'missing-env-02',
        type: 'missing-env-var',
        command: 'npm start',
        exitCode: 1,
        output: `
Error: Required environment variable OPENAI_API_KEY is missing
    at checkEnv (src/ai/client.ts:8:15)
    at bootstrapApp (src/app.ts:22:3)
    `.trim(),
        knownFixCommands: ['export OPENAI_API_KEY=sk-placeholder'],
        knownFixExplanation: 'OPENAI_API_KEY not set. Export it or add to .env before starting.',
    },
    {
        id: 'port-collision-01',
        type: 'port-collision',
        command: 'npm run dev',
        exitCode: 1,
        output: `
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:1432:16)
    at listenInCluster (node:net:1495:12)
    `.trim(),
        knownFixCommands: ['npx kill-port 3000'],
        knownFixExplanation: 'Port 3000 is in use. Kill the existing process or change PORT env var.',
    },
    {
        id: 'port-collision-02',
        type: 'port-collision',
        command: 'node server.js',
        exitCode: 1,
        output: `
Error: listen EADDRINUSE: address already in use :::8080
    at Server.setupListenHandle [as _listen2] (node:net:1432:16)
    `.trim(),
        knownFixCommands: ['npx kill-port 8080'],
        knownFixExplanation: 'Port 8080 is in use. Kill the process on that port before restarting.',
    },
    {
        id: 'test-assertion-01',
        type: 'test-assertion',
        command: 'npm test',
        exitCode: 1,
        output: `
FAIL src/sum.test.ts
  ✕ adds 1 + 2 to equal 3 (5ms)
  
    expect(received).toBe(expected)
    Expected: 3
    Received: 2
    
      at Object.<anonymous> (src/sum.test.ts:6:21)
    `.trim(),
        knownFixCommands: ['npm test -- --updateSnapshot'],
        knownFixExplanation: 'Test assertion mismatch. Review the implementation or update the snapshot.',
    },
    {
        id: 'platform-path-01',
        type: 'platform-path',
        command: 'npm run build',
        exitCode: 1,
        output: `
Error: ENOENT: no such file or directory, open 'src/components/Button'
    at Object.openSync (node:fs:600:3)
Import requires .tsx extension on case-sensitive file systems (Linux).
    `.trim(),
        knownFixCommands: ['find . -name "button.tsx" -exec mv {} Button.tsx \\;'],
        knownFixExplanation: 'Case-sensitive filesystem issue. Rename file to match import case exactly.',
    },
    {
        id: 'dep-mismatch-03',
        type: 'dependency-mismatch',
        command: 'cargo test --lib',
        exitCode: 101,
        output: `
error[E0308]: mismatched types
  --> src/lib.rs:45:9
   |
45 |         "hello"
   |         ^^^^^^^ expected u32, found &str
error: aborting due to previous error
    `.trim(),
        knownFixCommands: ['cargo fix --lib -p mylib'],
        knownFixExplanation: 'Type mismatch in Rust lib. Use cargo fix to auto-apply suggestion.',
        distractorOutput: 'error[E0502]: cannot borrow `x` as mutable because it is also borrowed as immutable',
    },
    {
        id: 'test-assertion-02',
        type: 'test-assertion',
        command: 'pytest tests/',
        exitCode: 1,
        output: `
FAILED tests/test_api.py::test_status_code - AssertionError: assert 404 == 200
E  assert 404 == 200
E   +  where 404 = <Response [404]>.status_code
    `.trim(),
        knownFixCommands: ['pytest tests/ -v --tb=short'],
        knownFixExplanation: 'API endpoint returned 404. Verify route registration and URL prefix in test client.',
    },
];
/** Distractor scenarios: same command family but different error — should NOT match */
export const DISTRACTORS = [
    {
        id: 'distractor-01',
        command: 'npm test',
        output: 'TypeError: undefined is not a function at index.js:5:10',
    },
    {
        id: 'distractor-02',
        command: 'tsc --noEmit',
        output: 'error TS1005: ; expected at src/app.ts(10,5)',
    },
];
//# sourceMappingURL=fixtures.js.map