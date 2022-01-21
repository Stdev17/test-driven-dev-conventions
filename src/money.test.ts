import {Won, Dollar, Yen, MoneyAdd, MoneyMultiply} from './money';

describe('서로 다른 두 통화를 더하면', () => {
    const moneyKorean = new Won(1000);
    const moneyUS = new Dollar(4);
    const moneyJapan = new Yen(200);

    test('같은 통화 더하기', () => {
        expect(MoneyAdd(moneyUS, moneyUS)).toEqual(new Dollar(8));
    });
    test('환율에 맞춰 USD 객체가 반환된다', () => {
        expect(MoneyAdd(moneyKorean, moneyUS)).toEqual(new Dollar(5));
    });
    test('JPY도 가능', () => {
        expect(MoneyAdd(MoneyAdd(moneyJapan, moneyKorean), moneyUS)).toEqual(new Dollar(7));
    });
});

describe('통화에 임의의 스칼라 값을 곱하면', () => {
    const money = new Dollar(1);
    const moneyWon = new Won(1000);

    test('통화 값에 곱해진 객체가 반환된다', () => {
        expect(MoneyMultiply(money, 4)).toEqual(new Dollar(4));
    });
    test('Won에도 똑같이 적용', () => {
        expect(MoneyMultiply(moneyWon, 4)).toEqual(new Won(4000));
    });
});