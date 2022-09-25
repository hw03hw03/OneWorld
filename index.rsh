'reach 0.1';

const Shared = {
  see: Fun([Bool], Null),
}

const length = 1;
export const main = Reach.App(() => {
  const A = Participant('Alice', {
    // Specify Alice's interact interface here
    ...Shared,
    getCost: Fun([], UInt),
    getB: Fun([], Bool),
    num: UInt,
  });
  const B = Participant('Bob', {
    // Specify Bob's interact interface here
    ...Shared,
    showMe: Fun([UInt, UInt], Null),
  });
  init();
  A.publish();
  commit();
  A.only(() => {
    const cost = declassify(interact.getCost());
  })
  // The first one to publish deploys the contract
  A.publish(cost);
  commit();
  B.interact.showMe(cost, length);
  B.pay(cost);
  const end = lastConsensusTime() + length;
  commit();
  wait(relativeTime(end));
  A.only(() => {
    const b = declassify(interact.getB());
  })
  A.publish(b);
  (b ? transfer(balance()).to(B) :  transfer(balance()).to(A));
  
  each([A, B], () => {
    interact.see(b);
  });
  commit();
  // write your program here
  exit();
});
