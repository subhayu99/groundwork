## linked-lists

route: `/categories/data-structures/linked-lists/` · diagram shape: line

The captured run renders the structured register, which is 5 beats: setup, instinct (the wedge), structure, operations, and name. The "obvious" and "when it fits" beats are not in this register. The top bar reads "LINKED LISTS · ORDER LIVES IN THE ARROWS, NOT THE POSITIONS" with a "MAP" link, an "IDEA 4 OF 7" chip, a "step N/5" counter, and the current beat label. A "BUILDS ON" row carries an "Arrays & Lists" prereq pill (visible until dismissed with the X on the right). The main panel sits under the canvas with a label/title/body, and a "WHY? · CODE · RECAP" chip row over a row of step dots. Side rails show "BACK" on the left and the forward action label (or a LOCKED padlock on gated beats) on the right.

### Beat 1 — The setup

![linked-lists beat1 desktop](img/linked-lists/beat1-d.png)
![linked-lists beat1 mobile](img/linked-lists/beat1-m.png)

The visual is a sorted array row of cells 1, 2, 4, 5, 7, 8, 10 with a dashed vertical gap marker between cell 2 and cell 4, captioned "3 wants to land here". The main panel is labelled "THE SETUP" with title "Add one item to a sorted list, without disturbing the rest." and body text about keeping friends in alphabetical order where a new friend belongs between the 2nd and 3rd name and everyone after must slide down a spot. There is no diagram interaction on this beat; the forward action reads "I HAVE THE QUESTION" on desktop and "I have the question" on mobile, and the step counter shows 1/5 with the first of five dots filled. On mobile the canvas stacks above the panel and the back/forward controls run along the bottom bar ("Back · 1 / 5 · I have the question").

### Beat 2 — The instinct

![linked-lists beat2 desktop](img/linked-lists/beat2-d.png)
![linked-lists beat2 mobile](img/linked-lists/beat2-m.png)

The visual switches to the linked-list chain: a "head" label arrows into nodes 1, 2, 4, 5, 7, each drawn as a value box plus a small "next" compartment with a dot, arrows linking each node to the next, ending in "None". A caption above reads "click a button and count what changed", and a "Pointer edits: 0" counter sits below. Three SVG buttons ("insert 3 after node 1", "insert 6 after node 3", "remove the 3rd card") plus a "reset" button drive the chain; a note callout reads "The instinct: how many existing cards actually had to change on an insert? On a remove?" with an arrow up to the chain. The interaction type is wedge: this beat is gated, captured here in its pre-interaction (LOCKED) state with the padlock on the right rail and the footer hint "TRY IT ON THE DIAGRAM TO CONTINUE". Clicking a button splices the chain, recolors the touched nodes and the single rerouted pointer green, updates the edit count (2 for an insert, 1 for a remove), fires onInteractionDone, and unlocks forward navigation.

### Beat 3 — The structure

![linked-lists beat3 desktop](img/linked-lists/beat3-d.png)
![linked-lists beat3 mobile](img/linked-lists/beat3-m.png)

The visual spotlights the third node (value 4) of the chain: it is highlighted while the other nodes are dimmed, with the label "value" above its left compartment and "next" plus "(address of next box)" below its right compartment, and an arrow pointing down into the next compartment. The main panel is labelled "THE STRUCTURE" with title "A node: one value + the address of the next." and body explaining that a linked list is a chain of boxes called nodes, each carrying a value plus a pointer to the next, where you start at the head and follow arrows until None. There is no gating interaction on this beat; the forward action reads "WHAT'S CHEAP?" and the step counter shows 3/5.

### Beat 4 — The operations

![linked-lists beat4 desktop](img/linked-lists/beat4-d.png)
![linked-lists beat4 mobile](img/linked-lists/beat4-m.png)

The visual shows the full chain with the last node (value 7) highlighted and a caption "we want the node holding 7, sitting at the far end". Below the chain a PREDICT panel asks "The 7 lives in the last node. How does the chain reach it?" with three choices: "jump straight to it by its position", "start at the head, follow arrow after arrow", and "step in from the None at the end". The main panel is labelled "THE OPERATIONS" with title "Cheap edits, expensive lookups." and body contrasting O(1) inserts/removes where you stand against O(n) find or jump. The interaction type is wedge (a prediction gate), captured pre-interaction, so the right rail shows LOCKED and the footer reads "TRY IT ON THE DIAGRAM TO CONTINUE". Tapping a pill commits the prediction and fires onInteractionDone; after a short pause the FindWalk playback runs the head-to-tail traversal, lighting each node and counting the hops, and a cost table (insert/remove O(1), find/jump O(n)) appears.

### Beat 5 — Linked list

![linked-lists beat5 desktop](img/linked-lists/beat5-d.png)
![linked-lists beat5 mobile](img/linked-lists/beat5-m.png)

The visual shows the clean chain (all nodes in the accent tone), a left "cost recap" column (insert after node O(1), remove next node O(1), access by index O(n), find a value O(n), stored together? no), and on the right two mini diagrams: "singly: one arrow (-> next)" with three nodes 1, 2, 4 linked forward, and "doubly: two arrows (<-> prev/next)" with forward arrows plus return arrows in a second color. The main panel is labelled "THE STRUCTURE" with title "Linked List." and body defining singly vs doubly linked and the idea that position is not address (order is whatever the arrows say). This is the closing beat; the forward action reads "FINISH" and the step counter shows 5/5 with the last dot filled.

### Code drawer

![linked-lists code drawer desktop](img/linked-lists/drawer-code-d.png)

Opening the drawer slides in a "THE CODE SO FAR" panel on the right, marked "OPTIONAL · algorithm.py · the lesson works without it". The Python source imports `dataclass` and `Optional`, defines a `@dataclass class Node` with `value: int` and `next: Optional["Node"] = None`, then `insert_after(node, value) -> Node` (docstring "Splice a new node in after `node`. O(1)…", with `new_node = Node(value=value, next=node.next)` then `node.next = new_node`), `remove_after(node) -> Optional[Node]` (unlinks the following node, O(1), with a None check), and the start of `find(head, value)`. Line 11 (`def insert_after`) carries the active-line indicator, matching the codeLabels on the operations beat. A close (X) control sits at the drawer's top-right.
