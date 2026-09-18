---
name: webmcp-site-author
description: Implement task-completing imperative WebMCP tools using document.modelContext.registerTool.
---

# WebMCP

WebMCP is a proposed browser standard that lets websites expose their functionality directly to AI agents as structured tools.

It exposes declarative and imperative APIs, and the full specification can be found here https://webmachinelearning.github.io/webmcp/

The ChatGPT implementation only supports the imperative inerface

## API structure

```ts
interface Document {
  readonly modelContext?: ModelContext; // Page-scoped registry; feature-detect support.
}

interface ModelContext {
  registerTool(
    tool: {
      name: string; // Unique, stable action identifier.
      description: string; // What the tool does and when to use it.
      inputSchema: object; // JSON Schema describing accepted input.
      execute(input: unknown): unknown | Promise<unknown>; // Validate, act, return result.
      title?: string; // Human-readable display label.
      annotations?: {
        // Behavioral hints, not security boundaries.
        readOnlyHint?: boolean; // True only when no state changes.
        untrustedContentHint?: boolean; // True for external or user-generated output.
      };
    },
    options?: {
      signal?: AbortSignal; // Abort to unregister this tool.
    },
  ): void | Promise<void>; // Register one tool for this page.
}
```

## Example call site

```ts
const context =
  typeof document === "undefined" ? undefined : document.modelContext;
if (!context?.registerTool) return;
const lifecycle = new AbortController();

try {
  void Promise.resolve(
    context.registerTool(
      {
        name: "create_booking",
        title: "Create booking",
        description:
          "Book the selected slot and update the visible reservation.",
        inputSchema: {
          type: "object",
          properties: { slotId: { type: "string" } },
          required: ["slotId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const booking = await bookSlot(validateInput(input));
          return { id: booking.id, status: "confirmed" };
        },
      },
      { signal: lifecycle.signal },
    ),
  ).catch(reportError);
} catch (error) {
  reportError(error);
}

return () => lifecycle.abort();
```

## Tool-design rules

- Distinguish **read**, **navigate/start**, **stage/configure**, and **complete** in names and descriptions. `create_event` means an event is created; `start_event_creation` only opens or prepares a flow. Never conceal side effects in an ambiguous verb.
- Prefer batched APIs where possible, rather than requiring clients to write loops.
- Return concise JSON-serializable results only after the action and visible state finish updating.
- Register once client-side, clean up with `AbortSignal`, and handle unsupported browsers and registration failures.
