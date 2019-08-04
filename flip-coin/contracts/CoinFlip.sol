pragma solidity ^0.5.0;

contract CoinFlip {

    struct Bank {
        string name;
        uint256 balance;
        bool isCreated;
    }

	address public owner;
	mapping (address => bool) lastFlip;
	mapping (address => int256) userHistory;
	
	mapping(address => Bank) Banks;
	//mapping (address => uint256) bankBalance;
	address[] public listOfBank;

	constructor() public payable{
		owner = msg.sender;

		// Contract address
		require(msg.value > 0);
		Banks[msg.sender].balance = msg.value;
		Banks[msg.sender].name = "FED";
		Banks[msg.sender].isCreated = true;
		listOfBank.push(msg.sender);
		lastFlip[msg.sender] = false;
	}

	modifier onlyOwner{
		require(owner == msg.sender);
		_;
	}

	modifier isBankCreated{
		require(Banks[msg.sender].isCreated == true, "Bank doesn't exist");
		_;
	}

	// add name to the bank Struct
	function createBank(string memory _name) public payable{
		require(Banks[msg.sender].isCreated == false, "You can only own one bank");
		require(msg.value > 0);
		Banks[msg.sender].balance = msg.value;
		Banks[msg.sender].isCreated = true;
		Banks[msg.sender].name = _name;
		listOfBank.push(msg.sender);
	}

	function getListOfBank() view public returns(address[] memory){
		return listOfBank;
	}

	function getBankBalance(address _bankAddr) view public returns(uint256){
		return Banks[_bankAddr].balance;
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
		
		require(1 ether > msg.value, "bet should be less than 1 eth");
		require(msg.value > 0, "bet can't be 0");
		
		uint256 jackpotValue = msg.value * 2;
		require(Banks[_bankAddr].balance >= jackpotValue, "bank balance should be greater than the jackpot");

		// Run the pseudorandom function
		uint randomResult = pseudoRandom();

		if(randomResult % 2 == 0){
			Banks[_bankAddr].balance -= msg.value;
			msg.sender.transfer(jackpotValue);
			userHistory[msg.sender] += int256(msg.value);
			lastFlip[msg.sender] = true;
		} else {
			Banks[_bankAddr].balance += msg.value;
			userHistory[msg.sender] -= int256(msg.value);
			lastFlip[msg.sender] = false;
		}
	}

	function sendMoneyToTheBank() public payable {
		require(Banks[msg.sender].isCreated == false, "You don't have a bank yet");
		Banks[msg.sender].balance += msg.value;
	}

	function isBankOwner(address _myCall) public returns (bool){
		if (Banks[_myCall].isCreated == true)
			return true;
		return false;
	}

	function withdrawBankAccount() public payable isBankCreated{
		require(Banks[msg.sender].balance != 0);
		msg.sender.transfer(Banks[msg.sender].balance);
		Banks[msg.sender].balance = 0;
	}

	function destroyContract() public onlyOwner{
		selfdestruct(msg.sender);
	}
}