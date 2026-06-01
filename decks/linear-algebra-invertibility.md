# Linear Transformations, Transposition, and Invertibility

---
## Linear transformations, transposition, invertibility

- matrix = a recipe for a linear map
- transpose = the *adjoint*, not just a flip
- invertibility = no information lost

::: narration
This is a technical pass through three of the most central ideas in linear algebra: linear transformations, the transpose, and invertibility. The aim isn't to introduce them but to draw the connections. A matrix is not a table of numbers; it's a recipe for a linear transformation in coordinates. The transpose is not just a flip; it's the adjoint, the dual operator with respect to the inner product. And invertibility is not one property among many; it's the condition that the transformation loses no information — equivalently, that a dozen seemingly different statements all hold at once.
:::

---
## A matrix is a linear transformation

<div class="la2">
<style>
.la2 svg{width:62%}
.la2 .ax{stroke:#B9A78A;stroke-width:1}
.la2 .grid{stroke:#E0CFB8;stroke-width:.6}
.la2 .sq{fill:#F6E5D2;fill-opacity:.55;stroke:#1A3F70;stroke-width:1.4}
.la2 .e1{stroke:#1A3F70;stroke-width:3.5;stroke-linecap:round}
.la2 .e2{stroke:#0F5D5D;stroke-width:3.5;stroke-linecap:round}
.la2 .et{fill:#1A3F70}
.la2 .ut{fill:#0F5D5D}
</style>
<svg viewBox="-130 -110 260 220">
<line class="grid" x1="-130" y1="-30" x2="130" y2="-30"/>
<line class="grid" x1="-130" y1="30" x2="130" y2="30"/>
<line class="grid" x1="-130" y1="-60" x2="130" y2="-60"/>
<line class="grid" x1="-130" y1="60" x2="130" y2="60"/>
<line class="grid" x1="-130" y1="-90" x2="130" y2="-90"/>
<line class="grid" x1="-130" y1="90" x2="130" y2="90"/>
<line class="grid" x1="-30" y1="-110" x2="-30" y2="110"/>
<line class="grid" x1="30" y1="-110" x2="30" y2="110"/>
<line class="grid" x1="-60" y1="-110" x2="-60" y2="110"/>
<line class="grid" x1="60" y1="-110" x2="60" y2="110"/>
<line class="grid" x1="-90" y1="-110" x2="-90" y2="110"/>
<line class="grid" x1="90" y1="-110" x2="90" y2="110"/>
<line class="ax" x1="-130" y1="0" x2="130" y2="0"/>
<line class="ax" x1="0" y1="-110" x2="0" y2="110"/>
<polygon class="sq" points="0,0 30,0 30,-30 0,-30"><animate attributeName="points" dur="4.2s" repeatCount="indefinite" values="0,0 30,0 30,-30 0,-30;0,0 60,-30 30,-75 -30,-45;0,0 30,0 30,-30 0,-30" keyTimes="0;0.5;1"/></polygon>
<line class="e1" x1="0" y1="0" x2="30" y2="0"><animate attributeName="x2" dur="4.2s" repeatCount="indefinite" values="30;60;30" keyTimes="0;0.5;1"/><animate attributeName="y2" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/></line>
<line class="e2" x1="0" y1="0" x2="0" y2="-30"><animate attributeName="x2" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/><animate attributeName="y2" dur="4.2s" repeatCount="indefinite" values="-30;-45;-30" keyTimes="0;0.5;1"/></line>
<circle class="et" r="4"><animate attributeName="cx" dur="4.2s" repeatCount="indefinite" values="30;60;30" keyTimes="0;0.5;1"/><animate attributeName="cy" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/></circle>
<circle class="ut" r="4"><animate attributeName="cx" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/><animate attributeName="cy" dur="4.2s" repeatCount="indefinite" values="-30;-45;-30" keyTimes="0;0.5;1"/></circle>
</svg>
</div>

- linearity: $T(\alpha v + \beta w) = \alpha T(v) + \beta T(w)$
- the $j$-th **column** of $A$ is $T(e_j)$

::: narration
A linear transformation is a map that respects vector addition and scaling — that is the whole definition. It has an immediate consequence that turns out to govern everything: a linear map is fully determined by where it sends the basis vectors, because every vector is a linear combination of basis vectors and the map preserves linear combinations. Pick a basis, write down where each basis vector goes, and you have completely specified the transformation. Stack those images as columns and you get a matrix. So a matrix is not really a table of numbers; it is a recipe that records what the transformation does to the basis, and matrix-vector multiplication is just the act of reconstructing the transformation from that recipe.
:::

---
## $Ax$ is a combination of the columns

- $Ax = x_1\,\mathbf{a}_1 + x_2\,\mathbf{a}_2 + \cdots + x_n\,\mathbf{a}_n$
- $\mathbf{a}_j$ = $j$-th column of $A$
- every output lives in $\mathrm{Col}(A)$

::: narration
Once you see the matrix as a list of column-images, matrix-vector multiplication becomes almost trivial. Ax is just x-one times the first column plus x-two times the second column and so on — a linear combination of the columns weighted by the entries of x. This is the entire computational content of matrix-vector multiplication, and it has an immediate geometric consequence: no matter what x you choose, the output Ax has to land somewhere in the span of the columns. That subspace is called the column space of A, and it is the image of the transformation. Whatever A does, the column space is its reach.
:::

---
## Image, kernel, and rank–nullity

<div class="la4">
<style>
.la4 svg{width:62%}
.la4 .ax{stroke:#B9A78A;stroke-width:1}
.la4 .grid{stroke:#E0CFB8;stroke-width:.6}
.la4 .sq{fill:#F6E5D2;fill-opacity:.55;stroke:#1A3F70;stroke-width:1.4}
.la4 .ker{stroke:#9D3A24;stroke-width:1.6;stroke-dasharray:5 4}
.la4 .e1{stroke:#1A3F70;stroke-width:3.5;stroke-linecap:round}
.la4 .e2{stroke:#0F5D5D;stroke-width:3.5;stroke-linecap:round}
.la4 .et{fill:#1A3F70}
.la4 .ut{fill:#0F5D5D}
</style>
<svg viewBox="-130 -110 260 220">
<line class="grid" x1="-130" y1="-30" x2="130" y2="-30"/>
<line class="grid" x1="-130" y1="30" x2="130" y2="30"/>
<line class="grid" x1="-130" y1="-60" x2="130" y2="-60"/>
<line class="grid" x1="-130" y1="60" x2="130" y2="60"/>
<line class="grid" x1="-30" y1="-110" x2="-30" y2="110"/>
<line class="grid" x1="30" y1="-110" x2="30" y2="110"/>
<line class="grid" x1="-60" y1="-110" x2="-60" y2="110"/>
<line class="grid" x1="60" y1="-110" x2="60" y2="110"/>
<line class="grid" x1="-90" y1="-110" x2="-90" y2="110"/>
<line class="grid" x1="90" y1="-110" x2="90" y2="110"/>
<line class="ax" x1="-130" y1="0" x2="130" y2="0"/>
<line class="ax" x1="0" y1="-110" x2="0" y2="110"/>
<line class="ker" x1="-40" y1="80" x2="40" y2="-80"/>
<polygon class="sq" points="0,0 30,0 30,-30 0,-30"><animate attributeName="points" dur="4.2s" repeatCount="indefinite" values="0,0 30,0 30,-30 0,-30;0,0 60,-30 90,-45 30,-15;0,0 30,0 30,-30 0,-30" keyTimes="0;0.5;1"/></polygon>
<line class="e1" x1="0" y1="0" x2="30" y2="0"><animate attributeName="x2" dur="4.2s" repeatCount="indefinite" values="30;60;30" keyTimes="0;0.5;1"/><animate attributeName="y2" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/></line>
<line class="e2" x1="0" y1="0" x2="0" y2="-30"><animate attributeName="x2" dur="4.2s" repeatCount="indefinite" values="0;30;0" keyTimes="0;0.5;1"/><animate attributeName="y2" dur="4.2s" repeatCount="indefinite" values="-30;-15;-30" keyTimes="0;0.5;1"/></line>
<circle class="et" r="4"><animate attributeName="cx" dur="4.2s" repeatCount="indefinite" values="30;60;30" keyTimes="0;0.5;1"/><animate attributeName="cy" dur="4.2s" repeatCount="indefinite" values="0;-30;0" keyTimes="0;0.5;1"/></circle>
<circle class="ut" r="4"><animate attributeName="cx" dur="4.2s" repeatCount="indefinite" values="0;30;0" keyTimes="0;0.5;1"/><animate attributeName="cy" dur="4.2s" repeatCount="indefinite" values="-30;-15;-30" keyTimes="0;0.5;1"/></circle>
</svg>
</div>

- $\dim\mathrm{Im}(A) + \dim\ker(A) = \dim(\text{domain})$
- nontrivial kernel ⇔ the map **loses** directions

::: narration
Two complementary subspaces govern every linear map. The image, or column space, lives in the codomain and tells you where outputs can land. The kernel, or null space, lives in the domain and consists of every vector that the map crushes to zero. Their dimensions are bound together by the rank-nullity theorem: the dimension of the image plus the dimension of the kernel equals the dimension of the entire domain — nothing is lost in the count, the dimensions either pass through to the image or disappear into the kernel. The animation shows a two-by-two matrix whose two columns happen to be parallel. The whole plane collapses onto a single line; the dashed direction through the origin is the kernel — the direction that gets sent to zero — and a transformation with such a direction has, in a precise sense, lost a dimension.
:::

---
## Composition is multiplication

- $T_B \circ T_A \;\longleftrightarrow\; BA$
- apply $A$ **first**, then $B$
- noncommutative in general: $AB \neq BA$

::: narration
Matrix multiplication is not an arbitrary computational rule — it is exactly the composition of linear maps written in coordinates. If A is the matrix of one transformation and B is the matrix of another, then the matrix B times A represents "apply A first, then B." Read it right-to-left. The rule that the column-count of B must match the row-count of A is just the statement that the output dimension of A must be the input dimension of B. And the failure of commutativity — the fact that AB and BA are different in general — is just the geometric truth that composing two transformations in the opposite order produces a different transformation.
:::

---
## Change of basis: matrix vs. transformation

- same $T$, two bases → two matrices
- $A' = P^{-1} A P$ — **similar** matrices
- the matrix is a *coordinate representation*; $T$ is the object

::: narration
A subtle but important point: the matrix and the transformation are not the same thing. The transformation T is a basis-independent object — it acts on vectors regardless of how we name their coordinates. The matrix A is what you get when you choose a basis and write T down. Change the basis and the matrix changes too: if P is the change-of-basis matrix, the same T is now represented by P-inverse A P. Matrices related this way are called similar, and they share every basis-independent property — determinant, rank, eigenvalues, trace. Carrying this distinction in mind is what saves you from confusing properties of the representation with properties of the object.
:::

---
## The transpose, formally

<div class="la7">
<style>
.la7 svg{width:74%}
.la7 .grid{fill:none;stroke:#B9A78A;stroke-width:1.5}
.la7 .diag{stroke:#9D3A24;stroke-width:1.8;stroke-dasharray:4 4}
.la7 text{font-family:'Source Serif 4',Georgia,serif;font-size:18px;fill:#262A33;text-anchor:middle;dominant-baseline:middle}
.la7 .lbl{font-size:14px;fill:#7A736C;letter-spacing:.04em;text-transform:uppercase}
.la7 .arr{stroke:#1A3F70;stroke-width:1.6;fill:none}
</style>
<svg viewBox="0 0 460 200">
<text class="lbl" x="80" y="20">A</text>
<rect class="grid" x="20" y="40" width="120" height="120"/>
<line class="grid" x1="60" y1="40" x2="60" y2="160"/>
<line class="grid" x1="100" y1="40" x2="100" y2="160"/>
<line class="grid" x1="20" y1="80" x2="140" y2="80"/>
<line class="grid" x1="20" y1="120" x2="140" y2="120"/>
<line class="diag" x1="20" y1="40" x2="140" y2="160"/>
<text x="40" y="60">a</text>
<text x="80" y="60">b</text>
<text x="120" y="60">c</text>
<text x="40" y="100">d</text>
<text x="80" y="100">e</text>
<text x="120" y="100">f</text>
<text x="40" y="140">g</text>
<text x="80" y="140">h</text>
<text x="120" y="140">i</text>
<path class="arr" d="M170,100 C220,75 240,75 290,100" marker-end="url(#ar)"/>
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1A3F70"/></marker></defs>
<text class="lbl" x="380" y="20">A^T</text>
<rect class="grid" x="320" y="40" width="120" height="120"/>
<line class="grid" x1="360" y1="40" x2="360" y2="160"/>
<line class="grid" x1="400" y1="40" x2="400" y2="160"/>
<line class="grid" x1="320" y1="80" x2="440" y2="80"/>
<line class="grid" x1="320" y1="120" x2="440" y2="120"/>
<line class="diag" x1="320" y1="40" x2="440" y2="160"/>
<text x="340" y="60">a</text>
<text x="380" y="60">d</text>
<text x="420" y="60">g</text>
<text x="340" y="100">b</text>
<text x="380" y="100">e</text>
<text x="420" y="100">h</text>
<text x="340" y="140">c</text>
<text x="380" y="140">f</text>
<text x="420" y="140">i</text>
</svg>
</div>

- $(A^T)_{ij} = A_{ji}$ — reflect across the diagonal

::: narration
The first-encounter definition of the transpose is mechanical: A-transpose is the matrix you get by interchanging rows and columns — equivalently, reflecting the entries across the main diagonal. Entry i,j becomes entry j,i. That is the picture above. It is correct, but it is also misleading, because it makes the transpose look like a purely notational operation — a coincidence of how we draw matrices. The transpose actually has a basis-independent meaning, and the next slide gets at it.
:::

---
## The transpose as the *adjoint*

$$\langle Ax,\, y\rangle \;=\; \langle x,\, A^T y\rangle \qquad \text{for all } x \in \mathbb{R}^n,\; y \in \mathbb{R}^m$$

- characterized by **how it pairs with the inner product**
- basis-independent; the row/column flip is a consequence, not the definition

::: narration
Here is the deep characterization. For a matrix A from R-n to R-m, A-transpose is the unique linear map from R-m back to R-n such that the inner product of Ax with y equals the inner product of x with A-transpose y, for every choice of x and y. This identity defines the transpose without ever mentioning rows or columns — it speaks only of the geometry of the inner product. The visual flip we just saw is what this characterization happens to look like in the standard basis. Once you see the transpose this way — as the adjoint of A — a great deal of linear algebra is reorganized: orthogonal complements, the normal equations of least squares, every place where a quadratic form lurks, all of it is the adjoint identity in different costumes.
:::

---
## Algebra of transpose and inverse

$$(A^T)^T = A \qquad (A+B)^T = A^T + B^T \qquad \det(A^T) = \det(A)$$

$$(AB)^T = B^T A^T \qquad (AB)^{-1} = B^{-1} A^{-1} \qquad (A^{-1})^T = (A^T)^{-1} = A^{-T}$$

- both $^T$ and $^{-1}$ **reverse the order** on a product

::: narration
The algebraic rules for the transpose mirror those for the inverse in a way that is more than visual. Transpose distributes over addition, but reverses the order on a product — A-B-transpose equals B-transpose times A-transpose. Inverse does the same: A-B-inverse equals B-inverse times A-inverse. And the two operations commute with each other, so the transpose of the inverse is the inverse of the transpose, written A to the minus-T. The shared order-reversal is not a coincidence. Both transpose and inverse are operations that act dually on composition, and dual operations on a composition reverse the factors — the last thing done first.
:::

---
## The four fundamental subspaces

<div class="la10">
<style>
.la10 svg{width:84%}
.la10 .box{fill:none;stroke:#262A33;stroke-width:1.8}
.la10 .col{fill:#1A3F70;fill-opacity:.10;stroke:#1A3F70;stroke-width:1.4}
.la10 .nul{fill:#9D3A24;fill-opacity:.08;stroke:#9D3A24;stroke-width:1.4;stroke-dasharray:4 4}
.la10 text{font-family:'Source Serif 4',Georgia,serif;font-size:14px;fill:#262A33}
.la10 .tag{font-size:12px;fill:#7A736C;letter-spacing:.06em}
.la10 .arr{stroke:#1A3F70;stroke-width:1.8;fill:none}
.la10 .zero{stroke:#9D3A24;stroke-width:1.8;fill:none}
</style>
<svg viewBox="0 0 520 240">
<text class="tag" x="20" y="22">domain — R^n</text>
<rect class="box" x="20" y="30" width="180" height="180"/>
<rect class="col" x="20" y="30" width="180" height="125"/>
<rect class="nul" x="20" y="155" width="180" height="55"/>
<text x="110" y="95" text-anchor="middle">Row(A) = Col(Aᵀ)</text>
<text x="110" y="113" text-anchor="middle" font-size="12" fill="#7A736C">dim = r</text>
<text x="110" y="185" text-anchor="middle">Null(A)</text>
<text x="110" y="201" text-anchor="middle" font-size="12" fill="#7A736C">dim = n − r</text>
<text class="tag" x="320" y="22">codomain — R^m</text>
<rect class="box" x="320" y="30" width="180" height="180"/>
<rect class="col" x="320" y="30" width="180" height="125"/>
<rect class="nul" x="320" y="155" width="180" height="55"/>
<text x="410" y="95" text-anchor="middle">Col(A)</text>
<text x="410" y="113" text-anchor="middle" font-size="12" fill="#7A736C">dim = r</text>
<text x="410" y="185" text-anchor="middle">Null(Aᵀ)</text>
<text x="410" y="201" text-anchor="middle" font-size="12" fill="#7A736C">dim = m − r</text>
<path class="arr" d="M205,90 C240,75 280,75 315,90" marker-end="url(#a2)"/>
<text x="260" y="65" text-anchor="middle" font-size="13" fill="#1A3F70">T bijection</text>
<path class="zero" d="M205,185 C240,200 280,200 315,185" marker-end="url(#a3)"/>
<text x="260" y="225" text-anchor="middle" font-size="13" fill="#9D3A24">→ 0</text>
<defs><marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1A3F70"/></marker><marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#9D3A24"/></marker></defs>
</svg>
</div>

- $\mathrm{Null}(A) \perp \mathrm{Row}(A)$ in $\mathbb{R}^n$ · $\mathrm{Null}(A^T) \perp \mathrm{Col}(A)$ in $\mathbb{R}^m$

::: narration
Now we can draw the cleanest picture of what any linear map actually does. From a single matrix A you can extract four subspaces — the column space and null space of A, and the column space and null space of A-transpose — and the transpose is exactly what gives you the second pair. The remarkable fact is that within each space they fit together as orthogonal complements: the null space of A is perpendicular to the row space in the domain, and the null space of A-transpose is perpendicular to the column space in the codomain. The transformation itself sends the row space bijectively onto the column space, and crushes the null space to zero. Every linear map, no matter how complicated, factors through this picture.
:::

---
## The determinant: signed area

<div class="la11">
<style>
.la11 svg{width:62%}
.la11 .ax{stroke:#B9A78A;stroke-width:1}
.la11 .grid{stroke:#E0CFB8;stroke-width:.6}
.la11 .sq{fill:#1A3F70;fill-opacity:.18;stroke:#1A3F70;stroke-width:1.6}
.la11 .col{fill:#9D3A24;fill-opacity:.22;stroke:#9D3A24;stroke-width:1.6;opacity:0;animation:la11col 5s infinite}
.la11 .par{animation:la11par 5s infinite}
@keyframes la11par{0%,45%{opacity:1}55%,100%{opacity:0}}
@keyframes la11col{0%,45%{opacity:0}55%,100%{opacity:1}}
</style>
<svg viewBox="-130 -110 260 220">
<line class="grid" x1="-130" y1="-30" x2="130" y2="-30"/>
<line class="grid" x1="-130" y1="30" x2="130" y2="30"/>
<line class="grid" x1="-130" y1="-60" x2="130" y2="-60"/>
<line class="grid" x1="-130" y1="60" x2="130" y2="60"/>
<line class="grid" x1="-30" y1="-110" x2="-30" y2="110"/>
<line class="grid" x1="30" y1="-110" x2="30" y2="110"/>
<line class="grid" x1="-60" y1="-110" x2="-60" y2="110"/>
<line class="grid" x1="60" y1="-110" x2="60" y2="110"/>
<line class="grid" x1="-90" y1="-110" x2="-90" y2="110"/>
<line class="grid" x1="90" y1="-110" x2="90" y2="110"/>
<line class="ax" x1="-130" y1="0" x2="130" y2="0"/>
<line class="ax" x1="0" y1="-110" x2="0" y2="110"/>
<polygon class="sq par" points="0,0 60,-30 30,-75 -30,-45"/>
<polygon class="col" points="0,0 60,-30 90,-45 30,-15"/>
</svg>
</div>

- $\det A$ = signed scaling factor of the unit volume
- $\det A = 0$ ⇔ the map collapses dimensions ⇔ $A$ is **singular**

::: narration
The determinant of a square matrix has a clean geometric meaning: it is the signed factor by which A scales the unit n-volume. In two dimensions, det A is the signed area of the parallelogram that A makes out of the unit square. Three regimes: positive determinant means A preserves orientation while scaling; negative means it flips orientation; and zero means the unit cube has been squashed flat — the image lies entirely in a lower-dimensional subspace, and the map has lost at least one dimension. The animation toggles between these two cases: the navy parallelogram has nonzero area, so the matrix is invertible; the rust degenerate quadrilateral lies along a single line, so its determinant is zero and the matrix is singular. There is no inverse, because there is no way to unflatten what has been flattened.
:::

---
## The Invertible Matrix Theorem

For a square $n\times n$ matrix $A$, the following are **equivalent**:

- $A$ is invertible — there is $A^{-1}$ with $AA^{-1} = A^{-1}A = I$
- $\det(A) \neq 0$
- $\mathrm{rank}(A) = n$ — columns linearly independent and span $\mathbb{R}^n$
- $\ker(A) = \{0\}$ — only $x=0$ solves $Ax=0$
- $Ax = b$ has a **unique** solution for every $b$
- $A^T$ is invertible (and $0$ is not an eigenvalue)
- $A$ is a product of elementary matrices

::: narration
Now the centerpiece. For a square matrix, all of the following are equivalent: A is invertible; the determinant is non-zero; the rank is full; the columns are linearly independent and span the space; the kernel contains only the zero vector; the equation Ax equals b has a unique solution for every right-hand side b; the transpose is also invertible; zero is not an eigenvalue; A factors as a product of elementary row operations. These are not nine different conditions you might check independently — they are nine different languages saying the same thing. Algebraic, geometric, computational, dimensional, spectral. Each one names a different way of saying that the transformation loses no information. Mastering the Invertible Matrix Theorem is mostly a matter of seeing why each of these is the others wearing a different hat.
:::

---
## What it all says

- a **matrix** is the coordinate recipe for a **linear transformation**
- the **transpose** is the **adjoint** — basis-independent; the row/column flip is a *consequence*
- **invertibility** = bijection = $\det\neq 0$ = full rank = trivial kernel = ...
- a single property: *the transformation loses no information*

::: narration
Pulling the three threads together. A linear transformation is the basis-independent object; a matrix is its coordinate representation, and the columns of the matrix record where the transformation sends the basis. The transpose looks like a flip of numbers, but its real definition is the adjoint identity — it is the unique linear map that pairs correctly with the inner product, and that is what makes the row-column flip the right operation in the standard basis. Invertibility is the condition that the transformation is a bijection, which equivalently means it preserves dimension, scales volume nontrivially, has trivial kernel, has full rank, and has a nonzero determinant. The Invertible Matrix Theorem just collects these into one statement. Everything that follows in linear algebra — least squares, spectral theorems, decompositions — leans on this picture.
:::
