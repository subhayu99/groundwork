import { DerivationStep } from "@/shared/derivation/types";

export const graphsSteps: DerivationStep[] = [
  {
    step: 1,
    cards: [
      {
        label: "The setup",
        title: "Who knows whom? Which pages link to which? Which roads connect?",
        body: (
          <>
            <p>
              Some questions don&rsquo;t fit a tree. A tree is a hierarchy &mdash; one parent, many
              children, never back up. But friendships go both ways. Web links point sideways. Bus
              routes loop through the same stops twice.
            </p>
            <p>
              The data has <em>arbitrary</em> connections. We need a structure that allows them.
            </p>
          </>
        ),
        actionLabel: "I have the question",
      },
    ],
  },
  {
    step: 2,
    cards: [
      {
        label: "The obvious thing",
        title: "Force it into a tree. Watch the relationships disappear.",
        body: (
          <>
            <p>
              You could try to root your friends into a tree &mdash; pick one person, then their
              friends as children, then their friends&rsquo; friends. The first few levels work.
            </p>
            <p>
              Then you hit a friend who&rsquo;s already on the tree from another branch. Trees
              don&rsquo;t allow that. So you either skip the edge (and lose information), or you
              accept that this isn&rsquo;t a tree at all.
            </p>
          </>
        ),
        actionLabel: "Free the connections",
      },
    ],
  },
  {
    step: 3,
    cards: [
      {
        label: "The wedge",
        title: "Click any person. Follow their neighbors.",
        body: (
          <>
            <p>
              On the right is a small social network. Each person has a few direct connections.
              Click someone &mdash; their direct neighbors light up. Click one of those &mdash; their
              neighbors light up too.
            </p>
            <p>
              You&rsquo;re just following edges. Each click costs you a lookup of one person&rsquo;s
              neighbors. The structure isn&rsquo;t a tree because the edges run in every direction
              &mdash; and that&rsquo;s the point.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The wedge question:</strong> what&rsquo;s the smallest amount of bookkeeping
              the structure needs to answer &ldquo;who&rsquo;s connected to whom?&rdquo;
            </div>
          </>
        ),
        actionLabel: "Nodes plus edges",
      },
    ],
  },
  {
    step: 4,
    cards: [
      {
        label: "The structure",
        title: "Nodes plus edges. An adjacency list does both jobs.",
        body: (
          <>
            <p>
              A <strong>graph</strong> is a set of <em>nodes</em> (also called vertices) and a set of{" "}
              <em>edges</em> connecting pairs of them. Edges can be:
            </p>
            <p>
              <em>Directed</em> &mdash; arrows pointing one way (web links, Twitter follows). Or{" "}
              <em>undirected</em> &mdash; symmetric (friendships, road segments). And{" "}
              <em>weighted</em> if each edge carries a cost (distance, duration).
            </p>
            <p>
              The default storage: an <strong>adjacency list</strong> &mdash; a hash map from each
              node to a list of its neighbors. That&rsquo;s it. The whole graph in two lines of
              Python.
            </p>
          </>
        ),
        actionLabel: "What operations?",
      },
    ],
  },
  {
    step: 5,
    cards: [
      {
        label: "The operations",
        title: "Traverse it. Find paths. Spot connected groups.",
        body: (
          <>
            <p>
              <strong>BFS &mdash; breadth-first search:</strong> visit closer neighbors first.
              Finds shortest paths in unweighted graphs in <code>O(V + E)</code> (cost grows with how many nodes plus how many connections there are).
            </p>
            <p>
              <strong>DFS &mdash; depth-first search:</strong> dive deep along one path before
              backtracking. <code>O(V + E)</code>. Useful for detecting cycles, finding components,
              topological sort.
            </p>
            <p>
              <strong>Shortest path on weighted graphs:</strong> Dijkstra&rsquo;s algorithm, in{" "}
              <code>O((V + E) log V)</code>. (Its own topic later &mdash; it&rsquo;s a beautiful one.)
            </p>
            <p>
              <strong>The bookkeeping you&rsquo;ll always need:</strong> a <em>visited set</em>{" "}
              (hash map again) to avoid walking the same edge twice and looping forever.
            </p>
          </>
        ),
        actionLabel: "When it fits",
      },
    ],
  },
  {
    step: 6,
    cards: [
      {
        label: "When it fits",
        title: "Anywhere you'd say 'the connections between X.'",
        body: (
          <>
            <p>
              Reach for a graph any time the relationships are first-class: social networks, web
              crawlers, maps and routes, dependency graphs (npm packages, build systems, course
              prerequisites), state machines, knowledge graphs, recommendation systems.
            </p>
            <p>
              If the relationships are strictly hierarchical with no cycles, a tree is simpler and
              you should use that. If you keep finding back-edges, you&rsquo;ve graduated to graphs.
            </p>
          </>
        ),
        actionLabel: "Name it",
      },
    ],
  },
  {
    step: 7,
    cards: [
      {
        label: "The structure",
        title: "Graph.",
        body: (
          <>
            <p>
              That&rsquo;s the name. The vocabulary is dense for the size of the idea: <em>vertex</em>,{" "}
              <em>edge</em>, <em>degree</em>, <em>cycle</em>, <em>path</em>, <em>connected
              component</em>, <em>weight</em>, <em>directed acyclic graph</em> (a DAG, which is
              what a build system or a Git history is).
            </p>
            <p>
              But the data structure itself is the simplest one we&rsquo;ve seen: a hash map from
              node to a list of its neighbors. The richness lives in the algorithms you run on top.
            </p>
            <p>
              Open the drawer for the BFS and DFS skeletons.
            </p>
          </>
        ),
        actionLabel: "Mark complete",
      },
    ],
  },
];
