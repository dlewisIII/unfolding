# Explore: an emergent semantic view

Explore is a second projection of the same entry corpus. Journal orders entries by time; Explore will organize evidence-backed concepts and relationships in semantic space. It must not introduce a parallel content database or fixed editorial categories.

## Entities to preserve

### Entry

The authored publication remains the primary evidence. Analysis never modifies its body. Stable entry IDs, timestamps, original language, tags, review records, and independent connections are retained.

### Tag

A lightweight retrieval label attached to an entry. A tag can be proposed from local wording and reused for consistency. It makes no claim that the label is an enduring idea in the corpus.

### Concept

A normalized idea with its own stable ID, preferred label, aliases, description, lifecycle status, and provenance. A concept is supported by explicit mentions or semantic evidence spans in entries. Promotion from tag to concept requires evidence across contexts or an explicit author decision; it is not automatic.

### Connection

An independent, addressable edge rather than entry metadata. It may connect entry↔entry, entry↔concept, or concept↔concept. It stores relation type, direction where meaningful, explanation, evidence references, source (`author`, `algorithm`, or `LLM`), confidence, review status, and timestamps.

### Cluster

A computed or curated grouping of concepts and entries. It stores membership with weights, supporting signals, time-window stability, cohesion, separation from neighbouring clusters, cross-cluster bridges, and successive versions so that emergence can be inspected rather than overwritten.

### Explore section

A deliberately published navigation view backed by one or more stable clusters. It has an author-approved name, description, query/membership rule, ordering, and lifecycle state. It is a view, never a category written into an entry.

## Map model

The first useful map should not expose every record. Its visible nodes should normally be reviewed concepts and stable clusters; selected entries can appear as evidence or on drill-down. Edges should be reviewed, high-confidence conceptual relationships, aggregated connection patterns, or explicitly interesting cross-domain bridges.

Each visible claim must be traceable to entries and fragments. Layout coordinates are derived presentation state, not semantic truth.

## Signals for a stable semantic cluster

No single threshold promotes a cluster. Candidate scoring combines:

- number of distinct supporting entries, with duplicate or near-duplicate notes discounted;
- recurrence across separated periods rather than a short burst;
- semantic cohesion among member entries and concepts;
- tag/concept co-occurrence and a stable family of child concepts;
- density and diversity of reviewed Connections;
- graph centrality without allowing one frequent generic term to dominate;
- stability under repeated clustering runs and modest parameter changes;
- separation from neighbouring clusters, while preserving meaningful bridges;
- recurrence across different contexts or genres of entry;
- author assessment that the grouping represents a real continuing field of inquiry.

Frequency is evidence, not promotion. Thus `observer` can remain a central concept after many mentions, while Mathematics can become a cluster because it contains a coherent, recurring internal structure such as logic → proofs → sets → symmetry → groups → invariance.

## Cross-domain connections

A bridge is especially interesting when two concepts belong strongly to different stable clusters but share a repeated structural relation, evidence from multiple entries, and non-trivial semantic similarity that is not explained by generic vocabulary. Useful signals include graph betweenness, unexpectedly strong co-occurrence relative to each concept’s base rate, analogous relation patterns, and recurrence in different contexts.

The system should distinguish a direct claim made by the author, a textual analogy, a structural analogy inferred by analysis, and a speculative hypothesis. These must not be rendered with the same certainty.

## Algorithmic and LLM responsibilities

Algorithms should handle deterministic counts, temporal recurrence, co-occurrence, embeddings, neighbourhood density, centrality, clustering stability, and candidate ranking. An LLM may normalize aliases, propose concept descriptions, classify relation types, explain candidate connections, detect structural analogies, and surface evidence spans.

Neither method publishes semantic claims autonomously. LLM output must retain provenance and confidence; algorithmic scores must retain the model/version and parameters used.

## Author confirmation

Author confirmation is required to:

- promote a candidate into a canonical concept when interpretation is material;
- accept or reject substantive Connections and their explanations;
- name, merge, split, or retire stable clusters;
- promote a cluster to an Explore section;
- present a speculative cross-domain analogy as part of the public map.

Routine tag normalization and low-stakes candidate generation can remain suggestions without interrupting writing or publication.

## Preventing graph chaos

The public map uses progressive disclosure. It starts with a small set of stable clusters and central reviewed concepts, applies confidence and evidence thresholds, collapses aliases, suppresses generic or redundant nodes, aggregates repeated edges, and limits visible neighbours per node. Less stable concepts remain searchable or appear only inside a focused cluster view. Candidates, rejected relations, and historical cluster versions remain outside the public graph.

## Forming Explore navigation

An Explore subsection candidate must be a stable, interpretable cluster with sustained evidence, meaningful internal substructure, and enough distinction to provide a useful browsing lens. The author approves its label and publication. Its page filters and arranges the shared corpus through weighted membership; entries may belong to multiple sections without duplication.

The top-level navigation remains fixed: `Unfolding | Explore | About | Search | Theme`. Cluster growth changes only the contents beneath Explore, not the global menu. Explore itself should not appear until the corpus contains enough author-confirmed structure to make the view useful.
