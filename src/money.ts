type Currency = 
    'USD' |
    'KRW' |
    'JPY'
;

interface Money {
    moneyValue: number;
    moneyCurrency: Currency;
}

interface ExchangeRate {
    sink: Currency;
    // 소수점 5자리에서 반올림한다
    ratio: number;
}

const bank: {[src: string]: ExchangeRate[]} = {
    'KRW': [{sink: 'USD', ratio: 0.0010}],
    'USD': [{sink: 'KRW', ratio: 1000}],
    'JPY': [{sink: 'KRW', ratio: 10}],
};

class Money implements Money {
    moneyValue: number;
    moneyCurrency: Currency;
    constructor(_value: number, _currency: Currency) {
        this.moneyValue = _value;
        this.moneyCurrency = _currency;
    }
}

class Won implements Money {
    moneyValue: number;
    moneyCurrency: Currency = 'KRW';
    constructor(_value: number) {
        this.moneyValue = _value;
    }
}

class Dollar implements Money {
    moneyValue: number;
    moneyCurrency: Currency = 'USD';
    constructor(_value: number) {
        this.moneyValue = _value;
    }
}

class Yen implements Money {
    moneyValue: number;
    moneyCurrency: Currency = 'JPY';
    constructor(_value: number) {
        this.moneyValue = _value;
    }
}

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

const MoneyMultiply = function (m: Money, multiplier: number) {
    return new Money(m.moneyValue * multiplier, m.moneyCurrency);
};

export {Won, Dollar, Yen, MoneyAdd, MoneyMultiply};