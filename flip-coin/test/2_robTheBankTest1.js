const RobTheBank = artifacts.require("RobTheBank");
const truffleAssert = require('truffle-assertions');

contract("RobTheBank", async function(accounts){

  const bank_value = 50000;
  const wallet1 = accounts[0];

  beforeEach('setup contract for each test', async() => {
    RobTheBankInstance = await RobTheBank.new({from: wallet1, value: bank_value});
    //console.log(RobTheBankInstance);
  })

  /*
  *  Flip require test 
  */

  it("...[flip] A bet value should be maximum half of the bank value", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    const good_bet_value = initial_value/2;
    let is_error = 0;
    try {
    	await RobTheBankInstance.flip(banksaddr[0], { from: wallet1, value: good_bet_value, gas: 900000});
    } catch (error){
    	is_error = 1;
    }
    assert.equal(false, is_error, "The value sent to last flip is suppose to be good");
  });

  it("...[flip] A bet value should be less than 0.5 ether", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    const wrong_bet_value = 500000000000000000; // 0.5 ether
    let is_error = 0;
    try {
    	await RobTheBankInstance.flip(banksaddr[0], { from: wallet1, value: wrong_bet_value, gas: 900000});
    } catch (error){
    	is_error = 1;
    }
    assert.equal(true, is_error, "The value sent to last flip is suppose to be less than 0.5 eth");
  });

  it("...[flip] A bet value should be more than 0 wei", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    const wrong_bet_value = 0; // 0.5 ether
    let is_error = 0;
    try {
    	await RobTheBankInstance.flip(banksaddr[0], { from: wallet1, value: wrong_bet_value, gas: 900000});
    } catch (error){
    	is_error = 1;
    }
    assert.equal(true, is_error, "The value sent to last flip is suppose to be more than 0 wei");
  });

  it("...[flip] A bet value up to the maximum of half of the bank value should be wrong", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    const wrong_bet_value = initial_value+1000;
    let is_error = 0;
    try {
    	await RobTheBankInstance.flip(banksaddr[0], { from: wallet1, value: wrong_bet_value, gas: 900000});
    } catch (error){
    	is_error = 1;
    }
    assert.equal(true, is_error, "The value sent to last flip is suppose to be wrong");
  });

  /*
  *  Combined tests -> 2 functions call maximum
  */

  it("...[complex] Should send 5000 to the bank, the bank balance should be 'bank_value' + 5000", async () => {
    let amount_sent = 5000;
    try{
      await RobTheBankInstance.sendMoneyToTheBank({from: wallet1, value: amount_sent});
    } catch(error){
      console.log("Error in sendMoneyToTheBank: " +  error);
    }
    const value = await RobTheBankInstance.getBankBalance.call(wallet1);
    assert.equal(value, bank_value + amount_sent, "The value 15000 was not stored.");
  });

  /*
  *	 Mutliples tests
  */
  it("...[complex] After a flip the balance of the bank and the user should increase and decrease equaly", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const amount_bet = 5000;
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    let lastflip;
    try {
      let result = await RobTheBankInstance.flip(banksaddr[0], { from: wallet1, value: amount_bet, gas: 900000});
      try {
        truffleAssert.eventEmitted(result, 'ReturnValue', (ev) => {
          lastflip = ev[0];
          return lastflip;
        });        
      } catch {
        console.log("Can't catch emmit");
      }
    } catch {
      console.log("Flip error");
    }

    (lastflip == true) ? rst = amount_bet : rst = -amount_bet;
    const last_call_history = await RobTheBankInstance.getUserHistory.call(wallet1);
    const current_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    assert.equal(last_call_history, rst, "The value of user history is not equal to the result of the flip");
    assert.equal(current_value, initial_value - rst , "The balance of the bank is not equal to the initial value plus the result the flip");
  });

});
