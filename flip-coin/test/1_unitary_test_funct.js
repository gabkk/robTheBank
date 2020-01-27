const RobTheBank = artifacts.require("RobTheBank");
const truffleAssert = require('truffle-assertions');

contract("RobTheBankSimple", async function(accounts){

  const bank_value = 50000;
  const wallet1 = accounts[0];
  const bank_default_name = "FED";
  const bank_default_is_create = true;

  beforeEach('setup contract for each test', async() => {
    RobTheBankInstance = await RobTheBank.new({from: wallet1, value: bank_value});
    //console.log(RobTheBankInstance);
  })

  /*
  *  Test initial value from constructor
  */

  it("...[constructor] The constract should be initiat with a value > 0", async () => {
    await truffleAssert.fails(RobTheBank.new({from: wallet1, value: 0}),
    							truffleAssert.ErrorType.REVERT);
  });

  it("...[constructor] The owner of the constract should be account[0]", async () => {
    const owner = await RobTheBankInstance.owner();
    assert.equal(owner, wallet1, "The contract owner is not the first account.");
  });

  it("...[constructor] The first bank own by account[0] should have the default param", async () => {
    const bankDefault = await RobTheBankInstance.Banks(accounts[0]);
    
    assert.equal(bankDefault.name, bank_default_name,
    			"The first bank create in the constructor should have the default name.");
    assert.equal(bankDefault.isCreated, bank_default_is_create,
    			"The first bank create in the constructor should the isCreated parameter set to true.");
    assert.equal(bankDefault.balance, bank_value,
    			"The first bank create in the constructor should have the default balance.");
  });

  it("...[constructor] The first bank should be push into the listOfBank", async () => {
    let firstBank = 0;
    try {
	    firstBank = await RobTheBankInstance.listOfBank.call(0);
    } catch (error){
    	console.log(error);
    	throw null;
    }
    assert.equal(firstBank, wallet1, "The first account should possess the first bank.");
  });

  it("...[constructor] The contract should emit a LogListOfBank event", async () => {
	let result = await truffleAssert.createTransactionResult(RobTheBankInstance, RobTheBankInstance.transactionHash);
	truffleAssert.eventEmitted(result, 'LogListOfBank', (ev) => {
	    return ev.name === "FED" && ev.addr === accounts[0] && parseFloat(ev.balance) === bank_value;
	}, 'LogListOfBank should be emitted with correct parameters');
  });

  /*
  *  Simple tests of getter
  */

  it("...[simple] Should set the initial bank address with account[0]", async () => {
    //const banksaddr = await RobTheBankInstance.getListOfBank();
    const banksaddr = await RobTheBankInstance.getListOfBank();
    assert.equal(banksaddr[0], wallet1, "The contract is not set with the first account.");
  });

  it("...[simple] Should set the initial bank deposit with the value of 'bank_value'", async () => {
    const value = await RobTheBankInstance.getBankBalance.call(wallet1);
    assert.equal(value, bank_value, "The value 'bank_value' was not stored.");
  });

  it("...[simple] User historic should be 0", async () => {
    const value = await RobTheBankInstance.getUserHistory.call(wallet1);
    assert.equal(value, 0, "The value of user history is not 0");
  });


});
