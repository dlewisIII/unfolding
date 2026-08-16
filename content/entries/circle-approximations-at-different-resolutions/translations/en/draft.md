# The Area of a Circle as a Limit of Finite Approximations

We will investigate how the accuracy of an approximation to the area of a circle changes when the circle is divided into different numbers of concentric rings.

If we mentally cut and straighten a ring, we can approximately represent it as a long strip resembling a trapezoid. We replace it with a rectangle whose height corresponds to the length of the ring's inner circumference. Part of the area is then left unaccounted for, so the value obtained for each ring is smaller than its actual area.

We add the areas of all these rectangles to approximate the area of the entire circle.

**How does increasing the number of rings affect the accuracy of the result? What happens if we divide the circle into more and more increasingly thin rings? Can a sequence of approximations yield the exact area of the circle even though every finite approximation $S_n$ remains smaller than $\pi$?**

## Constructing the approximation

As an example, consider a circle of radius

$$
R=1.
$$

We divide it successively into $4$, $10$, $1\,000$, and $1\,000\,000$ concentric rings.

If the circle is divided into $n$ rings of equal thickness, the thickness of each ring is

$$
\Delta r=\frac{1}{n}.
$$

Let the inner radius of a ring be

$$
r_k=\frac{k}{n},
\qquad k=0,1,\ldots,n-1.
$$

Thus, the inner radii of the rings are

$$
0,\quad \frac1n,\quad \frac2n,\quad \frac3n,\quad\ldots,\quad\frac{n-1}{n}.
$$

The length of each ring's inner circumference is

$$
C=2\pi r.
$$

When a ring is replaced by a rectangle, the rectangle's height equals the length of the inner circumference:

$$
h=2\pi r,
$$

and its width equals the thickness of the ring:

$$
\Delta r=\frac1n.
$$

Therefore, the area of one rectangle is

$$
A_{\text{rect}}=2\pi r\Delta r.
$$

To approximate the area of the entire circle, we add the areas of all the rectangles (using a left Riemann sum, since in our case the height of each rectangle is determined by the value of the function at the left endpoint of each interval):

$$
S_n=\sum_{k=0}^{n-1}2\pi r_k\Delta r.
$$

Here $k$ indexes the rings from $0$ to $n-1$. For each ring, its inner radius is

$$
r_k=\frac{k}{n},
$$

and the width of each interval is

$$
\Delta r=\frac{1}{n}.
$$

The summation notation expresses the same operation performed for every ring: calculate the area of its rectangle and add all the resulting areas.

Substituting the inner radii gives

$$
S_n=
2\pi\frac1n
\left(
0+\frac1n+\frac2n+\cdots+\frac{n-1}{n}
\right).
$$

Factoring out $1/n$ gives

$$
S_n=
\frac{2\pi}{n^2}
(0+1+2+\cdots+(n-1)).
$$

We use

$$
0+1+2+\cdots+(n-1)=\frac{n(n-1)}2.
$$

Then

$$
\begin{aligned}
S_n
&=\frac{2\pi}{n^2}\cdot\frac{n(n-1)}2\\
&=\pi\frac{n-1}{n}\\
&=\pi\left(1-\frac1n\right).
\end{aligned}
$$

## Approximation error

To understand how far the result is from the actual area of the circle, we calculate the absolute and relative errors.

The absolute error shows how far the calculated value is from the exact value:

$$
E_n=A-S_n.
$$

Since, for $R=1$,

$$
A=\pi,
$$

we obtain

$$
E_n=\pi-S_n=\frac{\pi}{n}.
$$

The relative error shows what fraction of the exact value is represented by the absolute error:

$$
e_n=\frac{\pi-S_n}{\pi}.
$$

In general,

$$
\text{relative error}
=
\frac{\text{absolute error}}{\text{exact value}}.
$$

This is a general principle, not a formula specific to the area of a circle.

In our case,

$$
\begin{aligned}
e_n
&=\frac{\pi-S_n}{\pi}\\
&=\frac{\pi/n}{\pi}\\
&=\frac1n.
\end{aligned}
$$

## Results

| $n$ | $\Delta r$ | $S_n$ | $E_n$ | Relative error |
| ---: | ---: | ---: | ---: | ---: |
| $4$ | $1/4$ | $3\pi/4$ | $\pi/4$ | $25\%$ |
| $10$ | $1/10$ | $9\pi/10$ | $\pi/10$ | $10\%$ |
| $1\,000$ | $1/1\,000$ | $999\pi/1\,000$ | $\pi/1\,000$ | $0.1\%$ |
| $1\,000\,000$ | $1/1\,000\,000$ | $0.999999\pi$ | $0.000001\pi$ | $0.0001\%$ |

For $n=1\,000\,000$, our approximation accounts for **99.9999% of the area**, leaving only **0.0001%** unaccounted for.

If $n$ is increased by a factor of 10, both the absolute and relative errors decrease by a factor of 10.

## What happens for finite $n$?

No matter how large a value of $n$ we choose, for any finite number of rings the result remains smaller than the actual area.

Since

$$
A=\pi R^2=\pi\cdot1^2=\pi,
$$

and

$$
S_n=\pi\left(1-\frac1n\right),
$$

for every finite $n$,

$$
\frac1n>0.
$$

Therefore,

$$
S_n<\pi=A.
$$

No finite approximation becomes the exact area of the circle.

For $n=1$, we obtain

$$
S_1=0.
$$

This is not an error: the only rectangle is constructed using the inner radius $r_0=0$, so its height and area are both zero.

## The limit

However, when

$$
n\to\infty,
$$

we have

$$
\frac1n\to0.
$$

Therefore,

$$
\begin{aligned}
\lim_{n\to\infty}S_n
&=\lim_{n\to\infty}\pi\left(1-\frac1n\right)\\
&=\pi.
\end{aligned}
$$

In the sequence

$$
S_1,S_2,S_3,\ldots,
$$

each $S_n$ corresponds to a finite number of rings. There is no separate element $S_\infty$ in this sequence.

Thus,

$$
\lim_{n\to\infty}S_n=\pi
$$

does not mean that there is some final, infinitely accurate approximation. It is a statement about the behavior of the entire sequence: by increasing the finite value of $n$, we can make $S_n$ arbitrarily close to $\pi$.

**The exact area of the circle is not one of the finite approximations. It is defined as the limit of the entire sequence of finite approximations.**
