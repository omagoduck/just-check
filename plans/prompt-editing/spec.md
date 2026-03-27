## Feature need: inline prompt editing with conversation branching.

*Note: I am not a proffessional software engineer. So my spec may have wrong design or decision. But the overall idea is kinda same.*

### The core idea

When a user edits a previously sent message, the original is never touched. Instead, a new message is created that points to the same parent as the original. This makes them siblings. The conversation becomes a tree of messages rather than a flat list, and the UI shows one path through that tree at a time.

Everything in this feature lives in the existing `messages` table. No migrations needed.

---

### How the data is structured

Every message has a `previous_message_id`. For the very first message in a conversation, that value is `null`. For every other message, it points to the message that came before it.

Two messages are siblings when they share the same `previous_message_id` — whether that value is a UUID or `null`. Null is not a special case. It is simply the parent ID of root-level messages, and root messages can have siblings just like any other message.
Siblings are always user messages, because branching only happens when a user edits their own prompt.

---

### A complete example from scratch

**Step 1 — a normal conversation, no edits yet**

The user sends A, the assistant replies with B. The user sends C, the assistant replies with D.

```
A (user)       — prev: null
B (assistant)  — prev: A
C (user)       — prev: B
D (assistant)  — prev: C
```

Displayed as:
```
A: tell me about black holes
B: Black holes are regions of spacetime...
C: what about neutron stars
D: Neutron stars are incredibly dense...
```

---

**Step 2 — user edits C**

The user decides to change their message C. A new message C′ is created with `prev: B` — the same parent as C. The assistant generates a new reply D′ with `prev: C′`.

```
A  (user)       — prev: null
B  (assistant)  — prev: A
C  (user)       — prev: B     ← original, created first
C′ (user)       — prev: B     ← edit, created later   (sibling of C)
D  (assistant)  — prev: C
D′ (assistant)  — prev: C′
```

C and C′ are siblings because both have `prev: B`. D and D′ are not siblings — they have different parents. D′-'s parent is C′.

The active path after the edit is the one ending at the most recently created leaf, which is D′. So the display shows:

```
A: tell me about black holes
B: Black holes are regions of spacetime...
C′: what about white dwarfs
< 2 / 2 > (this indicator stays right beside where copy and edit button are)
D′: White dwarfs are the remnants of...
```

The `< 2 / 2 >` appears at beside the action tools C′, because that is the branching point. It means: you are on branch 2 of 2 at this level. The user can click `<` to go back to branch 1.

---

**Step 3 — user switches back to branch 1**

```
A: tell me about black holes
B: Black holes are regions of spacetime...
C: what about neutron stars
< 1 / 2 > (again, this indicator stays right beside where copy and edit button are)
D: Neutron stars are incredibly dense...
```

Notice that previous messages from the prompt (in this case A and B) are identical in both views. Only the part of the conversation at and after the adjacent branch point changes when switching branches.

---

**Step 4 — deep branching: editing within a branch**

The user is on the C′ branch and continues the conversation. They send E′, get F′ back, then decide to edit E′, creating E″. The assistant replies to E″ with F″.

```
A   (user)       — prev: null
B   (assistant)  — prev: A
C′  (user)       — prev: B
D′  (assistant)  — prev: C′
E′  (user)       — prev: D′    ← original
E″  (user)       — prev: D′    ← edit  (sibling of E′)
F′  (assistant)  — prev: E′
F″  (assistant)  — prev: E″
```

The active path ends at F″. It displays as:

```
A: tell me about black holes
B: Black holes are regions of spacetime...
C′: what about white dwarfs
< 2 / 2 >
D′: White dwarfs are the remnants of...
E″: how do they form exactly
< 2 / 2 >
F″: White dwarfs form when a medium-mass star...
```

There are now two independent branch switchers — one at the C level, one at the E level. Switching the C switcher replaces everything from C downward. Switching the E switcher only replaces everything from E downward. They do not affect each other.

---

**Step 5 — root-level branching**

The user edits their very first message A. The new message A′ has `prev: null`, making it a sibling of A at the root level.

```
A  (user)      — prev: null    ← original
A′ (user)      — prev: null    ← edit  (sibling of A)
B  (assistant) — prev: A
B′ (assistant) — prev: A′
```

Displayed when A′ is active:

```
A′: tell me about pulsars
< 2 / 2 >
B′: Pulsars are rapidly rotating neutron stars...
```

Root-level branching works exactly the same as branching anywhere else in the tree.

---

### How the active path is determined

On initial load, take latest timestamp that has no children, may be created at or updated at timestamp work. Walk backwards from that message to the root, following `previous_message_id` at each step. The resulting chain is the active path.

This means a fresh edit always becomes the active path automatically, because the new assistant reply is the most recently created leaf.

---

### How branch order ( x in < x / y >) is determined

Siblings are ordered by their creation time, oldest first. The original message is always branch 1. Each subsequent edit adds a new branch at the end. So if a message has been edited three times, the switcher shows `< 1 / 4 >` through `< 4 / 4 >`.

---

### Switching branches

When the user switches from branch X to branch Y at a given level, the display replaces everything from that level downward with the latest state of branch Y. "Latest state" means: find the most recently created leaf descendant of the selected sibling and walk back to build the path. The portion of the conversation above the switching point stays exactly the same.

---

### Branch context isolation — the most important rule

When sending a message or generating a reply in any branch, only the messages on that branch's direct ancestor chain are included in the request to the AI. Messages from other branches are loaded on the client for rendering the switcher UI, but they never touch the AI context.

**Example — generating F″:**

The ancestor chain of E″ is: `A → B → C′ → D′ → E″`

What gets sent to the AI:
```
user:      tell me about black holes       (A)
assistant: Black holes are regions...      (B)
user:      what about white dwarfs         (C′)
assistant: White dwarfs are remnants...    (D′)
user:      how do they form exactly        (E″)
```

What is NOT sent: C, D, E′, F′. They exist on the client. They are invisible to the AI when it is responding in the E″ branch. Each branch is a completely independent conversation thread from the AI's perspective.

---

### Sending a message or creating a branch

The send-message API routes now accepts an optional `previous_message_id` alongside the message content. (This is the only change to our backend, actually.)

- **Normal reply:** pass the ID of the last message in the current visible path (the path user is currently viewing in display, not complex just take the id of the previous message and send it).
- **Edit / branch:** pass the same `previous_message_id` as the message being replaced (i.e. the parent of the original, not the original itself).
- **Editing the root message:** pass `null`.

That's the only change to the API. The branching logic on the client handles everything else.

---

### User Experience

When user edits a message and send, user should be able to see that message immedeately as if it has been sent as a normal follow up. And branch switcher should be available below edited prompt immediately without waiting for finish or a refetch. Also user should be able to switch between any prompt's any branches while AI is streaming response for a prompt. If user switch to any other branch, while a stream is happening, it should continue in background, and user should be able to catch up the stream when he visits that branch.

---

### What NOT to do
- Never send all messages to the AI. Always send the current viewing/displayed branch (not even the active branch).
- Never store which branch is "active" in the database. Active path is always derived on the client from creation timestamps. Simple.
- Never treat `null` as a special case in sibling detection. `prev: null` is a valid parent ID and siblings at the root level are fully supported. it is just for first message detection.
- Don't overengineer, or introduce overcomplexity.
