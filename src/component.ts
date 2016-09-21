import {runNow, Now} from "hareactive/Now";
import {Behavior, placeholder} from "hareactive/Behavior";
import {Future} from "hareactive/Future";

// Quick n' dirty proof of concept implementation

function id<A>(a: A): A { return a; };
function snd<A, B>(a: [A, B]): B { return a[1]; }

type CompVal<A> = [A, Node[]];

/** Run component and the now-computation inside */
export function runComponentNow<A>(parent: Node, c: Component<A>): A {
  return c.content(parent).run();
}

/**
 * A component is a function from a parent DOM node to a now
 * computation I.e. something like `type Component<A> = (p: Node) =>
 * Now<A>`. We don't define it as a type alias because we wan't to
 * make it a monad in different way than Now.
 */
export class Component<A> {
  constructor(public content: (n: Node) => Now<A>) {}
  static of<B>(b: B): Component<B> {
    return new Component(() => Now.of(b));
  }
  of: <B>(b: B) => Component<B> = Component.of;
  chain<B>(f: (a: A) => Component<B>): Component<B> {
    return new Component((parent: Node) => {
      return this.content(parent).chain((a) => {
        return f(a).content(parent);
      });
    });
  }
  flatten<B>(now: Component<Component<A>>): Component<A> {
    return now.chain(id);
  }
  map<B>(f: (a: A) => B): Component<B> {
    return this.chain((a: A) => this.of(f(a)));
  }
  mapTo<B>(b: B): Component<B> {
    return this.chain((_) => this.of(b));
  }
  lift<T1, R>(f: (t: T1) => R, m: Component<T1>): Component<R>;
  lift<T1, T2, R>(f: (t: T1, u: T2) => R, m1: Component<T1>, m2: Component<T2>): Component<R>;
  lift<T1, T2, T3, R>(f: (t1: T1, t2: T2, t3: T3) => R, m1: Component<T1>, m2: Component<T2>, m3: Component<T3>): Component<R>;
  lift(f: Function, ...ms: any[]): Component<any> {
    const {of} = ms[0];
    switch (f.length) {
    case 1:
      return ms[0].map(f);
    case 2:
      return ms[0].chain((a: any) => ms[1].chain((b: any) => of(f(a, b))));
    case 3:
      return ms[0].chain((a: any) => ms[1].chain((b: any) => ms[2].chain((c: any) => of(f(a, b, c)))));
    }
  }
}

class MfixNow<M extends Behavior<any>[], O> extends Now<[M, O]> {
  constructor(private fn: (m: M) => Now<[M, O]>) {
    super();
  };
  run(): [M, O] {
    const placeholders: any = [
      placeholder(), placeholder(), placeholder(), placeholder()
    ];
    // const fakeArg: [M, O] = [placeholders, undefined];
    const [behaviors, out] = this.fn(placeholders).run();
    // Tie the recursive knot
    for (let i = 0; i < behaviors.length; ++i) {
      placeholders[i].replaceWith(behaviors[i]);
    }
    return [behaviors, out];
  };
}

/**
 * Something resembling the monadic fixpoint combinatior for Now.
 */
function mfixNow<M extends Behavior<any>[], O>(
  comp: (m: M) => Now<[M, O]>
): Now<[M, O]> {
  return new MfixNow(comp);
}

export function component<M extends Behavior<any>[], V, O>({model, view}: {
  model: (v: V) => Now<[M, O]>,
  view: (m: M) => Component<V>
}): Component<O> {
  return new Component((parent: Node) => mfixNow<M, O>(
    (bs) => view(bs).content(parent).chain((v: V) => model(v))
  ).map(snd));
}
