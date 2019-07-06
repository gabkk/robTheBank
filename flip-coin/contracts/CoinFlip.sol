pragma solidity ^0.5.0;

contract CoinFlip {
	address public owner;
	int256 private maxInt = 57896044618658097711785492504343953926634992332820282019728792003956564819967;
	int256 private minInt = maxInt + 1;
	mapping (address => bool) lastFlip;
	mapping (address => uint256) contractBalance;
	mapping (address => int256) userHistory;
	address[] public listOfBank;

	constructor() public payable{
		owner = msg.sender;

		// Contract address
		require(msg.value > 0);
		contractBalance[msg.sender] = msg.value;
		listOfBank.push(msg.sender);
		lastFlip[msg.sender] = false;
	}

	modifier onlyOwner{
		require(owner == msg.sender);
		_;
	}

	function createBank() public payable{
		require(contractBalance[msg.sender] == 0);
		contractBalance[msg.sender] = msg.value;
		listOfBank.push(msg.sender);
	}

	function getListOfBank() view public returns(address[] memory){
		return listOfBank;
	}

	function getBankBalance(address _bankAddr) view public returns(uint256){
		return contractBalance[_bankAddr];
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

	function flip(address _bankAddr) payable public{
		
		require(0.5 ether > msg.value, "-1");
		require(msg.value > 0, "-2");
		
		uint256 jackpotValue = msg.value * 2;
		require(contractBalance[_bankAddr] >= jackpotValue, "-3");

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
			contractBalance[_bankAddr] -= msg.value;
			msg.sender.transfer(jackpotValue);
			userHistory[msg.sender] += int256(msg.value);
			lastFlip[msg.sender] = true;
		} else {
			contractBalance[_bankAddr] += msg.value;
			userHistory[msg.sender] -= int256(msg.value);
			lastFlip[msg.sender] = false;
		}
	}

	function sendMoneyToTheBank(address _bankAddr) payable public onlyOwner{
		contractBalance[_bankAddr] += msg.value;
	}

	function withdrawBankAccount(address _bankAddr) public onlyOwner{
		msg.sender.transfer(contractBalance[_bankAddr]);
		contractBalance[_bankAddr] = 0;
	}

	function destroyContract() public onlyOwner{
		selfdestruct(msg.sender);
	}

	function isOwner() public view returns(bool status){
		if(msg.sender == owner)
			return true;
		else
			return false;
	}
}