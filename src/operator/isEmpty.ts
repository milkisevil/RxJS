import {Operator} from '../Operator';
import {Subscriber} from '../Subscriber';
import {Observable} from '../Observable';

/**
 * If the source Observable is empty it returns an Observable that emits true, otherwise it emits false.
 *
 * <img src="./img/isEmpty.png" width="100%">
 *
 * @returns {Observable} an Observable that emits a Boolean.
 */
export function isEmpty(): Observable<boolean> {
  return this.lift(new IsEmptyOperator());
}

class IsEmptyOperator<T> implements Operator<boolean, boolean> {
  call (observer: Subscriber<T>): Subscriber<boolean> {
    return new IsEmptySubscriber(observer);
  }
}

class IsEmptySubscriber extends Subscriber<boolean> {

  constructor(destination: Subscriber<any>) {
    super(destination);
  }

  private notifyComplete(isEmpty: boolean): void {
    const destination = this.destination;

    destination.next(isEmpty);
    destination.complete();
  }

  protected _next(value: boolean) {
    this.notifyComplete(false);
  }

  protected _complete() {
    this.notifyComplete(true);
  }
}
