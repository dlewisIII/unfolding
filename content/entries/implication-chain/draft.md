# Implication Chain

## Statement

Suppose that

1. $P \rightarrow Q$,
2. $Q \rightarrow R$.

Then

$$
P \rightarrow R.
$$

## Strategy

Our goal is to prove an implication.
A natural approach is to assume its antecedent, derive the consequent using the given premises, and then apply Conditional Proof.

## Proof

Assume $P$.

From $P \rightarrow Q$ and $P$, by Modus Ponens, we obtain $Q$.

From $Q \rightarrow R$ and $Q$, by Modus Ponens, we obtain $R$.

Therefore,

$$
P \rightarrow R,
$$

by Conditional Proof.

$\square$

## Remarks

This proof illustrates how Conditional Proof is often combined with inference rules such as Modus Ponens.
