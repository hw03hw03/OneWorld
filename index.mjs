/**
 * OneWorld verifiably secure Carbon Credit infrastructe
 * here to save the world.
 */

import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(1000);

const [ accAlice, accBob ] =
  await stdlib.newTestAccounts(2, startingBalance);
console.log('Hello, Alice and Bob!');

console.log('Launching...');
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());
const oneTok = await stdlib.launchToken(accAlice, "One World", "OWT");
await accBob.tokenAccept(oneTok.id);
console.log(`Token information:
  ID: ${oneTok.id}
  Name: ${oneTok.name}
  Symbol: ${oneTok.sym}
  Hard Capped Supply: 1440 ${oneTok.sym}`);

const RESULT = ['your company has exceeded Carbon Emission Allowance, you forfeit funds', 
'you lowered your carbon emissions, your Company funds will be returned'];

const Shared = (Who) => ({
  see: (b) => {
    const t = (b ? 1 : 0);
    console.log(`${Who} saw the result that ${RESULT[t]}`);
  },
});
const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
const beforeAlice = await getBalance(accAlice);
const beforeBob = await getBalance(accBob);

let cost = 0;
console.log('Starting backends...');
await Promise.all([
  backend.Alice(ctcAlice, {
    ...stdlib.hasRandom,
    // implement Alice's interact object here
    ...Shared('Admin'),
    getCost: () => {
      console.log(`The tiered cost of OWT tokens is as follows:
        Level 1 --> 50 USDC
        Level 2 --> +50%
        Level 3 --> +66%
        Level 4 --> +12%
        Level 5 --> +17.857%
        Level 6 --> +6.06%
        Level 7 --> +13.143%
      `);
      cost = stdlib.parseCurrency(50);
      return cost;
    },
    getB: () => {
      const num = Math.floor(Math.random() * 100)
      if(num % 2 == 0){
        return true;
      } else {
        return false;
      }
    },
  }),
  backend.Bob(ctcBob, {
    ...stdlib.hasRandom,
    ...Shared('Company'),
    // implement Bob's interact object here
    showMe: (c, l) => {
      console.log(`Show me cost ${stdlib.formatCurrency(c)} and length of contract is 
        one fiscal quarter ${l}`);
    },
  }),
]);
const afterAlice = await getBalance(accAlice);
const afterBob = await getBalance(accBob);

console.log(`Admin before ${beforeAlice} and Admin after ${afterAlice}`);
console.log(`Company before ${beforeBob} and Company after ${afterBob}`);
console.log(`Next period HARD CAP decrease of 2.11% is ${(1440*0.9788889)}.`);
//Unsure as to why the above arithmetic does not work as expected
console.log('Goodbye, Alice and Bob!');
