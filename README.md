# test-driven-dev-conventions

Test Driven Development의 'Money' 예제를 '개발자의 글쓰기'에 소개된 코드 컨벤션을 응용하여 **TypeScript**와 **Jest**로 작성해 보겠습니다.

## 코드 작성 과정

1. 유저 스토리 형태의 요구사항을 절 단위까지 계속 쪼개어 필요한 함수를 추려 낸다. 그리고 이를 주석으로 우선 표시한다.
2. 함수의 이름과 인터페이스를 확정짓고, 함수가 만족시켜야 할 조건을 정리한다.
3. 차근차근 하나씩 조건을 추가해 가면서 테스트 케이스를 작성 및 수정하고, 이를 만족하는 최소한의 코드를 작성한다.
3.1. 커밋하기 이전에는 테스트 범위를 해당 파일에만 적용하여 빠른 이터레이션을 진행한다.
4. 코드 작성이 끝나면, **.test.ts** 파일로 테스트 케이스를 시각적으로 분리한다.
5. 이후 커밋과 함께 유닛 테스트, 통합 테스트 등이 진행된다.

## TDD Money 예제

### Money 객체

```
통화가 다른 두 금액을 더해서 주어진 환율에 맞게 변한 금액을 결과로 얻을 수 있어야 한다.
어떤 금액을 어떤 수에 곱한 금액을 결과로 얻을 수 있어야 한다.
```

이를 토대로 조건을 구성하면

1. 100 KRW + 10 USD = ?
2. 100 KRW * k = ?

이제 **무조건** 실패하는 테스트 TestConversion과 TestMultiplication을 우선 작성한다. 스택은 TypeScript와 Jest를 사용한다. TS는 타입 추론 성능이 준수하기에 사람이 읽기에 자명하다면 타입 힌트를 달아주지 않아도 되는 경우가 많다.

```
describe('서로 다른 두 통화를 더하면', () => {
    let moneyKorean = new Money(1000, 'KRW');
    let moneyUS = new Money(4, 'USD');

    test('환율에 맞춰 USD 객체가 반환된다', () => {
        expect(Money.Add(moneyKorean, moneyUS)).toEqual(new Money(5, 'USD'));
    })
});

describe('통화에 임의의 스칼라 값을 곱하면', () => {
    let money = Money(1, 'USD');

    test('통화 값에 곱해진 객체가 반환된다', () => {
        expect(Money.Multiply(money, 4)).toEqual(new Money(4, 'USD'));
    })
});
```

각 객체는 임의의 변수에 묶어 두고 재활용할 필요 없이 그냥 ephemeral한 값으로 취급하는 것이 이롭다. 어차피 스코프를 벗어나면 자동으로 수거되므로, 그런 자잘한 퍼포먼스 이슈는 나중에 최적화할 때 돌아오면 된다.
물론 Money interface 자체가 네임스페이스에 정의된 바 자체가 없으므로 IDE의 린터부터 에러를 뱉어 낸다. 정말 객체 초기화를 위한 최소한의 기능만 갖춘 interface를 구현한다.

```
interface Money {
    priceValue: number;
    currency: string;
}

class Money implements Money {
    _value: number;
    _currency: string;
    constructor(_value: number, _currency: string) {
        //
    }
}

function MoneyAdd(lhs: Money, rhs: Money) {
    //
}

function MoneyMultiply(m: Money, multiplier: number) {
    //
}
```

이제 린터 상의 에러는 사라졌다. 하지만 `yarn test`로 Jest 테스트 스위트를 개시해 보면, Object가 들어가야 할 자리에 undefined가 나온다. 가장 하위 타입으로 어떤 객체에도 해당하지 않는다는 뜻이다. (null조차도!) 그러므로 일단 더하기와 곱하기 함수가 Money 객체를 반환하도록 하자. 이참에 KRW과 USD도 각각 Won과 Dollar로 리팩토링한다.

```
class Won implements Money {
    priceValue: number;
    constructor(_value: number) {
        this.priceValue = _value;
    }
}

class Dollar implements Money {
    priceValue: number;
    constructor(_value: number) {
        this.priceValue = _value;
    }
}

function MoneyAdd(lhs: Money, rhs: Money) {
    return new Dollar(1);
}

function MoneyMultiply(m: Money, multiplier: number) {
    return new Dollar(1);
}
```

이번에도 에러가 나오지만 이는 의도한 바다. Dollar 객체끼리 비교되는 것이다. 아까도 언급했지만 함수는 객체의 상태를 변동시키는 것이 아니라, 새로운 객체 값을 반환한다고 생각해야 한다. C++, Java 등에선 멤버 함수의 형태로 클래스에 제시되는 것이 일반적이기 때문에 간과하기 쉽지만, 이 사이드 이펙트 때문에 함수의 Idempotency가 깨진다면 테스트 환경에선 참 골치 아파진다. 물론 프로덕션에서 시한폭탄이 되는 것은 말할 것도 없다.

MoneyMultiply를 구현하는 것은 자명한 작업이다. Won과 Dollar는 같은 Money interface를 공유하므로 물론 이 테스트도 통과하게 할 수 있다.

```
    test('Won에도 똑같이 적용', () => {
        expect(MoneyMultiply(moneyWon, 4)).toEqual(new Won(4000));
    });
```

이제 환율을 적용할 때 각 Money 객체끼리의 통화를 확인할 수 있는 요소가 필요한데, 이를 enum으로 정의하여 넣겠다.

```
enum Currency {
    USD,
    KRW,
}

interface Money {
    moneyValue: number;
    moneyCurrency: Currency;
}
```

이제 같은 통화의 돈부터 더하는 기능을 추가한다.

```
    test('같은 통화 더하기', () => {
        expect(MoneyAdd(moneyUS, moneyUS)).toEqual(new Dollar(8));
    });
```

사실 Won과 Dollar는 이름만 바꿔서 추상화했을 뿐 같은 Money interface를 공유하고 있다. 따라서 일반적인 돈은 그냥 통화를 생성자에서 따로 설정하여 생성하면 된다.

```
class Money implements Money {
    moneyValue: number;
    moneyCurrency: Currency;
    constructor(_value: number, _currency: Currency) {
        this.moneyValue = _value;
        this.moneyCurrency = _currency;
    }
}

function MoneyAdd(lhs: Money, rhs: Money) {
    if (lhs.moneyCurrency === rhs.moneyCurrency) {
        return new Money(lhs.moneyValue + rhs.moneyValue, lhs.moneyCurrency);
    }
}
```

early return을 사용하면 curly brace 지옥도를 안 봐도 된다.

이제 환율을 구현해야 하는데, 환율 정보는 별도의 클래스 Bank에 정의하도록 한다. 그런데 환율 정보를 런타임에 등록 및 수정하는 것은 너무 위험천만한 일이다. 예컨데 Bank에 등록되지 않은 통화나 교환비를 조회하면 런타임에 undefined가 나올 수 있다. 등록하는 것도 mutate된 객체를 계속 들고 있어야 하므로 함수형 패러다임에 위배된다.

이 정보를 관리하기 위해서는 대신 SSoT를 외부 DB 같은 다른 곳에 두어야 한다. 지금은 실제 DB를 사용하지 않으므로 대강 Bank로 mocking하겠다. 이상한 통화를 집어넣으면 우선 TS에서 타입 에러를 줄 것이고, 등록되지 않은 교환비를 요구하면 Bank에서 적절한 에러 핸들링을 해줄 수 있다. 에러를 미리 핸들링하고, 또 조기에 발견하는 것은 개발 생산성에 막대한 이익을 가져다 준다. 그래서 타입 시스템과 함수형 패러다임이 각광받는 것이다.

```
type Currency = 
    'USD' |
    'KRW' |
    'JPY'
;

interface ExchangeRate {
    sink: Currency;
    // 소수점 5자리에서 반올림한다
    ratio: number;
}

const bank: Record<Currency, ExchangeRate[]> = {
    KRW: [{sink: 'USD', ratio: 0.0010}],
    USD: [{sink: 'KRW', ratio: 1000}],
    JPY: [],
};
```

enum과 dict를 활용하는 데 문제가 생겨서 일단 커스텀 타입으로 대체했다. Currency에 정의된 통화는 일단 빈 객체라도 정의되어야 런타임 에러를 피할 것이다.

```
const bank: {[src: string]: ExchangeRate[]} = {
    'KRW': [{sink: 'USD', ratio: 0.0010}],
    'USD': [{sink: 'KRW', ratio: 1000}],
    'JPY': [],
};
```

환율 정보가 Array에 저장되어 있으므로 배열 메서드로 조작한다. Map은 쉽게 멤버를 검색할 수 있지만, mutable하기 때문에 우선은 고려 대상에서 제외한다. 타입 에러는 조기에 검출되니, 비즈니스 로직에서의 예외 처리만 일단 추가한다.

```
const checkBank = function (source: Currency, sink: Currency) {
    const checkExists = bank[source as string].filter((val: ExchangeRate) => {
        return val.sink === sink
    });
    if (!(checkExists.length === 0)) {
        return checkExists[0].ratio;
    }
    // 런타임에 결정되는 작업이라 에러의 위험성이 있다.
    // 이는 적당히 핸들링하여 프로그램이 터지지 않게, 그리고 사후 로그에서 확인할 수 있게 한다.
    // 로그를 위한 구체적인 정보는 우선 생략한다. (커스텀 에러 타입 필요)
    throw new Error(
        "The exchange rate specified on the currency is not defined."
    );
};

const MoneyAdd = function (lhs: Money, rhs: Money) {
    if (lhs.moneyCurrency === rhs.moneyCurrency) {
        return new Money(lhs.moneyValue + rhs.moneyValue, lhs.moneyCurrency);
    }
    try {
        return new Money(lhs.moneyValue * checkBank(lhs.moneyCurrency, rhs.moneyCurrency) + rhs.moneyValue, rhs.moneyCurrency);
    }
    catch (e) {
        // 중앙 MQ에 에러 로그를 전송하는 작업이라든가...
        // 지금은 생략한다.
        console.log(e);
        // 우변의 돈이 그대로 유지된다
        return new Money(rhs.moneyValue, rhs.moneyCurrency);
    }
};
```

이제 조건에서 요구하는 모든 테스트 케이스를 통과한다. JPY 등의 다른 통화도 버그 걱정 없이 손쉽게 추가할 수 있다.

```
    test('JPY도 가능', () => {
        expect(MoneyAdd(MoneyAdd(moneyJapan, moneyKorean), moneyUS)).toEqual(new Dollar(7));
    });
```

이제 .test.ts 파일과 구현 코드를 분리하면, 코드가 해야 할 일을 추상화하여 쉽게 유지보수할 수 있게 된다. 신난다!!!

## 코드 컨벤션