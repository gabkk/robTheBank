var RobTheBank = artifacts.require("./RobTheBank.sol");

module.exports = function(deployer) {
  deployer.deploy(RobTheBank, {value: web3.utils.toWei("1", "ether"), gas: 4000000});
};