pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

import "../contracts/CoinFlip.sol";

contract TestCoinFlip {
  CoinFlip coinflip = CoinFlip(DeployedAddresses.CoinFlip());

  function testItListOfBank() public {
  	address[] memory test = coinflip.getListOfBank();
    Assert.equal(msg.sender, test[0], "The address of the first bank shoud be equal as msg.sender.");
  }

  function testItValueInBank() public {
  	uint256 value = coinflip.getBankBalance(msg.sender);
    Assert.equal(uint256(value), uint256(100000000), "The value in the first bank shoud be 100000000.");
  }

}