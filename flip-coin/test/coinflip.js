const CoinFlip = artifacts.require("./CoinFlip.sol");

contract("CoinFlip", function(accounts){


  beforeEach('setup contract for each test', async() => {
    CoinFlipInstance = await CoinFlip.new({value: 10000});
  })

  it("...should set the initial bank address with account[0]", async () => {
    const banksaddr = await CoinFlipInstance.getListOfBank();
    assert.equal(banksaddr[0], accounts[0], "The contract is not set with the first account.");
  });

  it("...should set the initial bank address with a value of 10000", async () => {
    const value = await CoinFlipInstance.getBankBalance.call(accounts[0]);
    assert.equal(value, 10000, "The value 10000 was not stored.");
  });

  it("...should sent 5000 to the bank the total should be 15000", async () => {
    await CoinFlipInstance.sendMoneyToTheBank(accounts[0], {value: 5000});
    const value = await CoinFlipInstance.getBankBalance.call(accounts[0]);
    assert.equal(value, 15000, "The value 15000 was not stored.");
  });

  it("...should have an history of 0", async () => {
    const value = await CoinFlipInstance.getUserHistory.call(accounts[0]);
    assert.equal(value, 0, "The value of user history is not 0");
  });

  it("...should have an history equal to 10000 if you win or -5000 if you loose", async () => {
    const banksaddr = await CoinFlipInstance.getListOfBank();
    try{
    	await CoinFlipInstance.flip(banksaddr[0], { from: accounts[0], value: 5000, gas: 900000});
    } catch (error){
    	assert(error.toString().includes('invalid opcode'), error.toString());
    }
    const lastflip = await CoinFlipInstance.getLastFlip(accounts[0]);
    let rst = 0;
    (lastflip == true) ? rst = 10000 : rst = -5000;
    const value = await CoinFlipInstance.getUserHistory.call(accounts[0]);
    assert.equal(value, rst, "The value of user history is not equal to the result of the flip");
  });

});
