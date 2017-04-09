<img align="right" src="https://avatars0.githubusercontent.com/u/21360882?v=3&s=200">

# Funnel

A purely functional frontend framework based on functional reactive
programming. Experimental.

[![Build Status](https://travis-ci.org/funkia/funnel.svg?branch=master)](https://travis-ci.org/funkia/funnel)
[![codecov](https://codecov.io/gh/funkia/funnel/branch/master/graph/badge.svg)](https://codecov.io/gh/funkia/funnel)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/funnel.svg)](https://saucelabs.com/u/funnel)

# Table of contents

* [High level overview](#high-level-overview)
* [Installation](#installation)
* [Example](#example)
* [Examples](#examples)
* [Tutorial](#tutorial)
* [Contributing](#contributing)

## High level overview

The goal of Funnel is to be a powerful framework for building frontend
applications in a purely functional way. Funnel is based on classic
FRP and we benefit from its highly concise way of declaring reactive
dataflow. Funnel is heavily inspired by functional techniques found in
Haskell that we combine with dynamic features found in JavaScript. We
want a functional framework that is highly expressive, convenient to
use, fast and a pleasure to use.

* Purely functional.
* Implemented in TypeScript. Later on, we'd like to support PureScript
  as well.
* Based on classic FRP. Behaviors represents values that change over
  time and streams provide reactivity. Funnel uses the FRP
  library [Hareactive](https://github.com/Funkia/hareactive).
* A component-based architecture. Components are encapsulated and
  composable. Components are monads and are typically used and
  composed with do-notation (do-notation is implemented with
  generators).
* Constructed DOM elements reacts directly to behaviors and streams.
  This avoids the overhead of using virtual DOM and should lead to
  great performance.
* Side-effects are expressed with a declarative IO-like monad. This
  allows for easy testing of effectful code. Furthermore, the IO-monad
  is integrated with FRP. This makes it possible to perform
  side-effects in response to user input.
* The entire dataflow through applications is explicit and easy to
  follow.

## Installation

```sh
npm install @funkia/funnel @funkia/hareactive @funkia/jabz
```

[Hareactive](https://github.com/Funkia/hareactive) and
[Jabz](https://github.com/Funkia/jabz) are peer dependencies that
Funnel uses. Hareactive is the FRP library that we use and Jabz
provides some very useful functional abstractions.
## Example

The example below creates an input field and print whether or not it
is valid.

```js
import {map} from "@funkia/jabz";
import {runMain, elements, loop} from "@funkia/funnel";
const {span, input, div} = elements;

const isValidEmail = (s: string) => s.match(/.+@.+\..+/i);

const main = go(function*() {
  yield span("Please enter an email address: ");
  const {inputValue: email} = yield input();
  const isValid = map(isValidEmail, email);
  yield div([
    "The address is ", map((b) => b ? "valid" : "invalid", isValid)
  ]);
});

// `runMain` should be the only impure function in application code
runMain("#mount", main);
```

A few explanations to the above code:

* The `go` function and the generator expresses do-notation, i.e.
  monadic chaining. Here the monad is `Component`.
* The function `input` returns `Component<{inputValue:
  Behavior<string>}>`. We `yield` it which binds the `inputValue`
  behavior to `email`.
* Next the `isValidEmail` predicate is mapped over the `email`
  behavior and a `div` component describing the validation status is
  added.

## Examples

Approximately listed in order of increasing complexity.

* [Simple](/examples/simple) — Very simple example of an
  email validator.
* [Fahrenheit celsius](/examples/fahrenheit-celsius) — A
  converter between fahrenheit and celsius.
* [Zip codes](/examples/zip-codes) — A zip code validator.
  Shows one way of doing HTTP-requests with the IO-monad.
* [Continuous time](/examples/continuous-time) —
  Shows how to utilize continuous time.
* [Counters](/examples/counters) — A list of counters.
  Demonstrates nested components, managing a list of components and
  how child components can communicate with parent components.
* [Todo](/examples/counters) — An implementation of the
  classic TodoMVC application. Note: Routing is not implemented yet.

## Tutorial

### FRP

Funnel builds on top of the FRP library Hareactive. The two key
concepts from FRP are _behavior_ and _stream_. They are documented in
more detail in the [Hareactive
readme](https://github.com/Funkia/hareactive). But the most important
things to understand is

* `Behavior` represents values that change over time. For instance,
  the position of the mouse or the number of times a user has clicked
  a button.
* `Stream` represents discrete events that happen over time. For
  instance click events.

### What is `Component`

 On top of the FRP primitives Funnel adds `Component`. Funnel is
 pretty much nothing but component. Once you understand
 `Component`—and how to use it—you understand Funnel. A Funnel app is
 just one big component.

* __Components can contain logic__ expressed through operations on
  behaviors and streams.
* __Components are encapsulated__ and have completely private state.
* __Components produce output__ through which they selectively decide
  what state they share with their parent.
* __Components write DOM elements__ as children to their parent. They
  can write zero, one or more DOM elements.
* __Components can declare side-effects__ expressed as `IO`-actions.
* __Components are composable__— one component can be combined with
  another component and the result is a third component.

### Element functions

Funnel includes functions for creating components that represent
standard HTML-elements. When you create your own components they will
be made of these.

For each HTML-element there is a function for creating a component
that represents it. The element functions accept two arguments, both
of which are optional. The first is an object describing various
things like attributes, classes on the element, etc. The second
argument is a child component. To create a div with a span child we
would do

```typescript
const myDiv = div({class: "foo"}, span("Some text"));
```

The element functions are overloaded. So instead of giving `span` a
component as child we can just give it a string. The element functions
also accepts an array of child elements like this

```typescript
const myDiv = div({class: "foo"}, [
  h1("A header"),
  p("Some text")
])
```

Using this we can build arbitrarily complex HTML

```typescript
const myForm = form([
  div({class: "form-group"}, [
    label("Email address"),
    input({attrs: {type: "email", placeholder: "email@address.com"}})
  ]),
  div({class: "checkbox"}, [
    label([
      input({attrs: {type: "checkbox"}}, "Want spam?")
    ])
  ])
]);
```

#### Dynamic HTML

Anywhere where we can give the element functions a constant value of a
certain type we can alternatively give them a behavior with a value of
that type. For instance, if we have a string-valued behavior we can
use it like this

```ts
const mySpan = span(stringBehavior);
```

This will construct a component representing a span element with text
content that is kept up to date with the value of the behavior.

#### Output from HTML components

Component is represented by a generic type `Component<A>`. The `A` represents
the output type of the component.

As an example, a component that represents an input element may have
output that contains a behavior of the current string value in the
input box.

```ts
const usernameInput = input({attrs: {placeholder: "Username"}});
```

`usernameInput` has the type `Component<Output>` where `Output` is an
object containing the output that an `input` element produces. Among
other things, an `input` element produces a string-valued behavior
name `inputValue` that contains the current content of the `input`
element. So, the type of `usernameInput` above is something like
`Component<{inputValue: Behavior<string>, ...}>`. The dots are there
to indicate the the component has other output as well.

We can get to the output of a component in several ways. One way is to
map over the component.

```ts
const usernameInput =
  input({attrs: {placeholder: "Username"}})
    .map((output) => output.inputValue.map((s) => s.length));
```

Here we create a component with the `input` function, we then invoke
`map` on the component. The function to `map` receives the output from
the component. We then call `map` on the behavior `inputValue` and
take the length of the string. The result is that `usernameInput` has
the type `Component<Behavior<number>>` because it's mapped output is a
number-valued behavior whose value is the current length of the text
in the input element.

### `chain` on `Component`

`map` makes it possible to transform and change the output from a
component. However, it does not make it possible to take output from
one component and pipe it into another component. To do that we will
have to use `chain`.

```typescript
chain((output: Output) => Component<NewOutput>): Component<NewOutput>;
```

The `chain` method on a components with output `Output` takes a
function that has `Output` as argument and returns a new component.
Here is an example.

```typescript
input().chain((inputOutput) => span(inputOutput.inputValue));
```

An invocation `component.chain(fn)` returns a new component that works
like this:

* The output from `component` is passed to `fn`.
* `fn` returns a new component, let's call it `component2`
* The DOM-elements from `component` and `component2` are both added to
  the parent.
* The output is the output from `component2`.

So, the above example boils down to this:

```typescript
Create input component   Create span component with text content
  ↓                             ↓
input().chain((inputOutput) => span(inputOutput.inputValue));
                   ↑                                ↑
      Output from input-element       Behavior of text in input-element
```

The result is an input element followed by a span element. When
something is written in the input the text in the span element is
updated accordingly.

With `chain` we can combine as many elements as we'd like. The code
below combines two `input` elements with a `span` that show the
concatenation of the text in the two input fields.

```typescript
input({ attrs: { placeholder: "foo" } }).chain(
  ({ inputValue: a }) => input().chain(
    ({ inputValue: b }) => span(["Combined text: ", a, b])
  )
);
```

However, the above code is very awkward and each invocation of `chain`
adds an extra layer of nesting. To solve the problem we use
generators.

```typescript
do(function*() {
  const {inputValue: a} = yield input();
  const {inputValue: b} = yield input();
  yield span(["Combined text: ", a, b]);
});
```

That is a lot easier to read! The `do` function works like this: for
every `yield`ed value it calls `chain` with a function that continues
the generator function with the value that `chain` passes it. So, when
we `yield` a `Component<A>` we will get an `A` back.

### `loop` for handling cyclic dependencies

Sometimes situations arise where there is a cyclic dependency between two
components.

For instance, you may have a function that creates a component that
shows the value of an input string-value behavior and outputs a
string-valued behavior.

```typescript
const myComponent = (b: Behavior<string>) => span(b).chain((_) => input());
```

Now we'd have a cyclic dependency if we wanted to construct two of
these views so that the first showed the output from the second and
the second showed output from the first. With `loop` we can do it like
this:

```typescript
loop(({output1, output2}) => do(function*() {
  const output1_ = yield myComponent(output2);
  const output2_ = yield myComponent(output1);
  return {output1: output1_, output2: output2_};
}));
```

The `loop` functional seems pretty magical. It has the following
signature (slightly simplified):

```ts
loop<A extends ReactiveObject>(f: (a: A) => Component<A>): Component<A>
```

I.e. `loop` takes a function that returns a component whose output has
the same type as the argument to the function. `loop` then passes the
output in as argument to the function. That is, `f` will as argument
receive the output from the component it returns. The only restriction
is that the output from the component must be an object with streams
and/or behaviors as values.

Visually it looks like this.

![loop figure](https://rawgit.com/funkia/funnel/master/figures/component-loop.svg)

### Building components with separated logic and view



![Component figure](https://rawgit.com/funkia/funnel/master/figures/model-view.svg)

## API Documentation

Nothing here yet. See the [examples](#examples).

## Contributing

Funnel is developed by Funkia. We develop functional libraries. You
can be a part of it too. Share your feedback and ideas. We also love
PRs.

Run tests once with the below command. It will additionally generate
an HTML coverage report in `./coverage`.

```sh
npm test
```

Continuously run the tests with

```sh
npm run test-watch
```
