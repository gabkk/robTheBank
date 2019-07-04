const CoinFlip = artifacts.require("./CoinFlip.sol");

contract("CoinFlip", function(accounts){


  beforeEach('setup contract for each test', async() => {
    CoinFlipInstance = await CoinFlip.new({value: 10000});
  })

  it("...should set the initial bank address with account[0]", async () => {
    const value = await CoinFlipInstance.getListOfBank();
    assert.equal(value[0], accounts[0], "The contract is not set with the first account.");
  });

  it("...should set the initial bank address with a value of 10000", async () => {
    const value = await CoinFlipInstance.getBankBalance.call(accounts[0]);
    assert.equal(value, 10000, "The value 10000 was not stored.");
  });

});
