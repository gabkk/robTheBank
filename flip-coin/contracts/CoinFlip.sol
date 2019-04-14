pragma solidity ^0.5.0;

contract CoinFlip {
	address owner;
	int256 private maxInt = 57896044618658097711785492504343953926634992332820282019728792003956564819967;
	int256 private minInt = maxInt + 1;
	mapping (address => bool) lastFlip;
	uint256 contractBalance;
	mapping (address => int256) userHistory;

	constructor() public payable{
		owner = msg.sender;

		// Contract address
		contractBalance = msg.value;
		lastFlip[msg.sender] = false;
	}

	modifier onlyOwner{
		require(owner == msg.sender);
		_;
	}

	function getBankBalance() view public returns(uint256){
		return contractBalance;
	}

	// Get the balance of the user
	function getUserHistory(address player) view public returns(int256){
		return userHistory[player];
	}

	// Get the result of the player flip
	function getLastFlip(address player) view public returns(bool){
		return lastFlip[player];
	}

	/*
	* As the timestamp can be control by the miner we need to set
	* a max limit per bet in the flip function.
	*/
	function pseudoRandom() private view returns (uint8) {
		uint8 result = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)))%251); 
		return result;
	}

	/*	Error Cases
	*
	*	error -1 Bet can't be more than 0.5
	*	error -2 user bet could't be null
	*	error -3 Contract address don't have enought found to pay the user
	*	error -4 The value is too big regarding to the previous contract rules
	*			 and it will make fail the implicit cast for the player historic
	*
	*/

	function flip() payable public{
		
		require(0.5 ether > msg.value, "-1");
		require(msg.value > 0, "-2");
		
		uint256 jackpotValue = msg.value * 2;
		require(contractBalance >= jackpotValue, "-3");

		/*
		*
		*	The value is too big regarding to the previous contract rules
		*	and it will make fail the implicit cast for the player history
		* 
		*/
		require(int256(jackpotValue) > minInt && int256(jackpotValue) < maxInt, "-4");


		// Run the pseudorandom function
		uint randomResult = pseudoRandom();

		if(randomResult % 2 == 0){
			contractBalance -= msg.value;
			msg.sender.transfer(jackpotValue);
			userHistory[msg.sender] += int256(jackpotValue);
			lastFlip[msg.sender] = true;
		} else {
			contractBalance += msg.value;
			userHistory[msg.sender] -= int256(msg.value);
			lastFlip[msg.sender] = false;
		}
	}

	function sendMoneyToTheBank() payable public onlyOwner{
		contractBalance += msg.value;
	}

	function withdrawBankAccount() public onlyOwner{
		msg.sender.transfer(contractBalance);
		contractBalance = 0;
	}

	function destroyContract() public onlyOwner{
		selfdestruct(owner);
	}
}