import {Observable} from '../Observable';
import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';

/**
 * Returns an Observable that skips all items emitted by the source Observable as long as a specified condition holds
 * true, but emits all further source items as soon as the condition becomes false.
 *
 * <img src="./img/skipWhile.png" width="100%">
 *
 * @param {Function} predicate - a function to test each item emitted from the source Observable.
 * @returns {Observable<T>} an Observable that begins emitting items emitted by the source Observable when the
 * specified predicate becomes false.
 */
export function skipWhile<T>(predicate: (value: T, index: number) => boolean): Observable<T> {
  return this.lift(new SkipWhileOperator(predicate));
}

class SkipWhileOperator<T, R> implements Operator<T, R> {
  constructor(private predicate: (value: T, index: number) => boolean) {
  }

  call(subscriber: Subscriber<T>): Subscriber<T> {
    return new SkipWhileSubscriber(subscriber, this.predicate);
  }
}

class SkipWhileSubscriber<T> extends Subscriber<T> {
  private skipping: boolean = true;
  private index: number = 0;

  constructor(destination: Subscriber<T>,
              private predicate: (value: T, index: number) => boolean) {
    super(destination);
  }

  protected _next(value: T): void {
    const destination = this.destination;
    if (this.skipping) {
      this.tryCallPredicate(value);
    }

    if (!this.skipping) {
      destination.next(value);
    }
  }

  private tryCallPredicate(value: T): void {
    try {
      const result = this.predicate(value, this.index++);
      this.skipping = Boolean(result);
    } catch (err) {
      this.destination.error(err);
    }
  }
}
