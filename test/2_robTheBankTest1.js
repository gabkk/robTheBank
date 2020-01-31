const RobTheBank = artifacts.require("RobTheBank");
const truffleAssert = require('truffle-assertions');

contract("RobTheBank", async function(accounts){

  const bank_value = web3.utils.toWei("0.2", 'ether');
  const bank_value2 = web3.utils.toWei("0.4", 'ether');
  const flip_value = web3.utils.toWei("0.1", 'ether');
  const max_value = web3.utils.toWei("10", 'ether');
  const wallet1 = accounts[0];
  const bankaddr1 = accounts[0];
  const wallet2 = accounts[1];
  const revert_error = "Returned error: VM Exception while processing transaction: revert";

  beforeEach('Setup contract for each test', async() => {
    RobTheBankInstance = await RobTheBank.new({from: wallet1, value: bank_value});
    //console.log(RobTheBankInstance);
  })

  afterEach('Destroy the contract to get back the fund used in the test', async() => {
    await truffleAssert.passes(RobTheBankInstance.destroyContract({from: wallet1}),
                   "Failed to destroy the contract");
  });
  /*
  *  Flip require test 
  */
  it("...[flip] Should fail message value empty", async () => {
      await truffleAssert.fails(RobTheBankInstance.flip(bankaddr1,
                                                        { from: wallet1,
                                                          value: 0,
                                                          gas: 70000
                                                        }),
                                                        "bet can't be less than 0,1");
  });

  it("...[flip] A bet value should be maximum the bank value", async () => {
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
  	await truffleAssert.fails(RobTheBankInstance.flip(bankaddr1,
                                                      { from: wallet1,
                                                        value: initial_value+1,
                                                        gas: 70000
                                                      }));
  });

  it("...[flip] A bet value should be less than 10 ether", async () => {
    const initial_value = await RobTheBankInstance.getBankBalance.call(wallet1);
    await truffleAssert.fails(RobTheBankInstance.flip(bankaddr1,
                                                      { from: wallet1,
                                                        value: max_value,
                                                        gas: 70000
                                                      }));
  });

  /* withdrawBankAccount */

  it("...[simple withdrawBankAccount] You shouldn't be able to withdraw from an empty bank account", async () => {
    await truffleAssert.reverts(RobTheBankInstance.withdrawBankAccount({from: accounts[1]}),
                                "Bank doesn't exist");
  });

  it("...[simple withdrawBankAccount] You should be able to withdraw from a bank account", async () => {
    await truffleAssert.passes(RobTheBankInstance.withdrawBankAccount({from: accounts[0]}));
  });

  
  it("...[simple withdrawBankAccount] The value withdraw should match with the contract balance minus gas fee", async () => {
    const accountBalanceBeforeTransaction = await web3.eth.getBalance(accounts[0]);
    const contractBalanceBeforeTransaction = await web3.eth.getBalance(RobTheBankInstance.address);

    let result = await RobTheBankInstance.withdrawBankAccount();

    let accountBalanceAfterTransaction = await web3.eth.getBalance(accounts[0]);
    const contractBalanceAfterTransaction = await web3.eth.getBalance(RobTheBankInstance.address);
    
    // this is the amount of gas used in for the transaction
    let tx_info = await web3.eth.getTransaction(result.tx);
    let finalGasPrice = result.receipt.gasUsed * tx_info.gasPrice;

    /*
    * Here we are adding the value hold by the contract before the transaction
    * To the old account Balance 
    * Minus the final Gas price
    */
    const accountValueExpected = parseInt(accountBalanceBeforeTransaction) +
                (parseInt((contractBalanceBeforeTransaction)-parseInt((contractBalanceAfterTransaction))))
                - parseInt(finalGasPrice);

    assert.equal(parseInt(accountBalanceAfterTransaction).toString(), accountValueExpected.toString(),
          "The value of the wallet should be equal to the difference between the old and the new contract value.");

  });

  /*
  * sendMoneyToTheBank
  */

  it("...[simple sendMoneyToTheBank] You should be able to send eth to your bank account", async () => {
    await truffleAssert.passes(RobTheBankInstance.sendMoneyToTheBank({value: flip_value,from: accounts[0]}));
  });

  it("...[simple sendMoneyToTheBank] You shouldn't be able to send 0 to your bank account", async () => {
    await truffleAssert.reverts(RobTheBankInstance.sendMoneyToTheBank({value: 0,from: accounts[0]}),
                                                                      "msg.value can't 0");
  });

  it("...[simple sendMoneyToTheBank] Check that the amount sent is add to the bank", async () => {
    const bankOldValue = await RobTheBankInstance.getBankBalance.call(wallet1);
    await truffleAssert.passes(RobTheBankInstance.sendMoneyToTheBank({value: web3.utils.toWei("0.01", 'ether'),from: accounts[0]}));
    const BankNewValue = await RobTheBankInstance.getBankBalance.call(wallet1);
    assert(BankNewValue, bankOldValue + web3.utils.toWei("0.01", 'ether'),
          "The value of the new bank should be increased by the amount value bet");
  });

  /*
  *  Combined tests -> 2 functions call maximum
  */

  it("...[complex] Should send "+flip_value+" to the bank, the bank balance should be 'bank_value' + "+flip_value, async () => {
    let amount_sent = flip_value;
    try{
      await RobTheBankInstance.sendMoneyToTheBank({from: wallet1, value: amount_sent});
    } catch(error){
      console.log("Error in sendMoneyToTheBank: " +  error);
    }
    const value = await RobTheBankInstance.getBankBalance.call(wallet1);
    let finalwalletValue = parseFloat(bank_value) + parseFloat(amount_sent);
    assert.equal(value.toString(), finalwalletValue.toString(), "The value "+finalwalletValue+" was not stored.");
  });

  /*
  *	 Mutliples tests
  *  Add user balance test
  */


  it("...[complex] After a flip the balance of the bank and the user should increase and decrease equaly", async () => {
    const banksaddr = await RobTheBankInstance.getListOfBank();
    const amount_bet = flip_value;
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
    let rst = 0;
    (lastflip == true) ? rst = amount_bet : rst = -amount_bet;
    const last_call_history = await RobTheBankInstance.getUserHistory.call(wallet1);
    const current_value = await RobTheBankInstance.getBankBalance.call(wallet1);

    assert.equal(last_call_history, rst, "The value of user history is not equal to the result of the flip");
    assert.equal(current_value, initial_value - rst , "The balance of the bank is not equal to the initial value plus the result the flip");
  });

});
