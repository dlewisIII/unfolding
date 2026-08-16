
We can make an approximation increasingly precise by dividing a system into smaller and smaller parts. But there is a question that the accuracy of each individual part does not answer:

**What happens when all of these small errors are added together?**

Consider the same circle divided into concentric rings. If we cut and straighten one ring with inner radius $r$ and thickness $\Delta r$, its exact area is

$$
A_{\text{exact}}
=
\pi(r+\Delta r)^2-\pi r^2.
$$

Expanding the square gives

$$
A_{\text{exact}}
=
2\pi r\Delta r+\pi(\Delta r)^2.
$$

Our rectangular approximation accounts for

$$
A_{\text{rectangle}}
=
2\pi r\Delta r.
$$

So the part we omit is not merely vaguely “small.” We can calculate it exactly:

$$
E_{\text{one}}
=
A_{\text{exact}}-A_{\text{rectangle}}
=
\pi(\Delta r)^2.
$$

This tells us something important about how the approximation behaves. The rectangular contribution is proportional to $\Delta r$, while the error is proportional to $(\Delta r)^2$.

For a fixed $r>0$,

$$
\frac{E_{\text{one}}}{A_{\text{rectangle}}}
=
\frac{\pi(\Delta r)^2}{2\pi r\Delta r}
=
\frac{\Delta r}{2r}.
$$

Therefore,

$$
\lim_{\Delta r\to0}
\frac{E_{\text{one}}}{A_{\text{rectangle}}}
=
0.
$$

As the ring becomes thinner, its error becomes negligible relative to the area we are approximating.

The rate matters. If we make the ring $10$ times thinner, then

$$
\Delta r\rightarrow\frac{\Delta r}{10},
$$

and its error becomes

$$
\pi\left(\frac{\Delta r}{10}\right)^2
=
\frac{E_{\text{one}}}{100}.
$$

So a $10$-fold decrease in thickness produces a $100$-fold decrease in the error of one ring.

But this is still only a **local** result.

If we divide an entire circle of radius $R$ into $n$ equal rings, then

$$
\Delta r=\frac{R}{n}.
$$

The error of each ring is therefore

$$
E_{\text{one}}
=
\pi\left(\frac{R}{n}\right)^2
=
\frac{\pi R^2}{n^2}.
$$

There are $n$ such errors to accumulate. Since the error is the same for every ring,

$$
E_{\text{total}}
=
nE_{\text{one}}
=
n\frac{\pi R^2}{n^2}
=
\frac{\pi R^2}{n}.
$$

Thus,

$$
\lim_{n\to\infty}E_{\text{total}}=0.
$$

This distinction between local and accumulated error is important. Making each individual approximation more accurate is not by itself enough to tell us what happens to the complete model. We also need to know **how quickly the local error decreases and how many such errors accumulate**.

Here the two effects compete in a precise way. Making the rings $10$ times thinner makes each local error $100$ times smaller, but creates $10$ times as many rings. The accumulated error therefore becomes $10$ times smaller.

**The accuracy of the whole cannot be inferred from the size of one local error alone. It depends on the relationship between how local errors shrink and how they accumulate across the system.**

