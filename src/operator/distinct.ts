import {Observable} from '../Observable';
import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';
import {Subscription} from '../Subscription';

/**
 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous items.
 * If a comparator function is provided, then it will be called for each item to test for whether or not that value should be emitted.
 * If a comparator function is not provided, an equality check is used by default.
 * As the internal HashSet of this operator grows larger and larger, care should be taken in the domain of inputs this operator may see.
 * An optional paramter is also provided such that an Observable can be provided to queue the internal HashSet to flush the values it holds.
 * @param {function} [compare] optional comparison function called to test if an item is distinct from previous items in the source.
 * @param {Observable} [flushes] optional Observable for flushing the internal HashSet of the operator.
 * @returns {Observable} an Observable that emits items from the source Observable with distinct values.
 */
export function distinct<T>(compare?: (x: T, y: T) => boolean, flushes?: Observable<any>) {
  return this.lift(new DistinctOperator(compare, flushes));
}

class DistinctOperator<T, R> implements Operator<T, R> {
  constructor(private compare: (x: T, y: T) => boolean, private flushes: Observable<any>) {
  }

  call(subscriber: Subscriber<T>): Subscriber<T> {
    return new DistinctSubscriber(subscriber, this.compare, this.flushes);
  }
}

export class DistinctSubscriber<T> extends Subscriber<T> {
  private values: any[] = [];
  private flushSubscription: Subscription;

  constructor(destination: Subscriber<T>, compare: (x: T, y: T) => boolean, flushes: Observable<any>) {
    super(destination);
    if (typeof compare === 'function') {
      this.compare = compare;
    }

    if (flushes) {
      this.add(this.flushSubscription = flushes.subscribe(new FlushSubscriber(this)));
    }
  }

  flush() {
    this.values.length = 0;
  }

  private compare(x: T, y: T): boolean {
    return x === y;
  }

  protected _next(value: T): void {
    let found = false;
    const values = this.values;
    const len = values.length;
    try {
      for (let i = 0; i < len; i++) {
        if (this.compare(values[i], value)) {
          found = true;
          return;
        }
      }
    } catch (err) {
      this.destination.error(err);
      return;
    }
    this.values.push(value);
    this.destination.next(value);
  }

  protected _complete(): void {
    super._complete();
  }

  unsubscribe(): void {
    super.unsubscribe();
  }
}

export class FlushSubscriber extends Subscriber<any> {
  constructor(private parent: DistinctSubscriber<any>) {
    super();
  }

  next() {
    this.parent.flush();
  }

  complete() {
    // noop
  }

  error(err: any) {
    this.parent.error(err);
  }
}